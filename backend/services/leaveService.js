const db = require('../config/db');

// Helper: Log to audit trail
const logAudit = async (action, entityType, entityId, performedBy, oldValues = null, newValues = null, status = 'SUCCESS') => {
  try {
    await db.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, old_values, new_values, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, entityType, entityId, performedBy, JSON.stringify(oldValues), JSON.stringify(newValues), status]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

// Helper: Create notification
const createNotification = async (userId, title, message, type, referenceId = null, referenceType = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, message, type, referenceId, referenceType]
    );
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

class LeaveService {
  // Apply for leave
  static async applyLeave(employeeId, leaveTypeId, fromDate, toDate, reason) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Validate dates
      if (new Date(fromDate) > new Date(toDate)) {
        throw new Error('From date must be before to date');
      }

      // Calculate total days
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

      // Ensure leave balances are initialized for the current year
      const checkBalanceExist = await client.query(
        `SELECT COUNT(*) FROM employee_leave_balance WHERE employee_id = $1 AND year = $2`,
        [employeeId, new Date().getFullYear()]
      );
      if (parseInt(checkBalanceExist.rows[0].count) === 0) {
        const leaveTypes = await client.query(`SELECT id, total_days FROM leave_types`);
        for (const type of leaveTypes.rows) {
          await client.query(
            `INSERT INTO employee_leave_balance (employee_id, leave_type_id, available_days, used_days, year)
             VALUES ($1, $2, $3, 0, $4)
             ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
            [employeeId, type.id, type.total_days, new Date().getFullYear()]
          );
        }
      }

      // Check leave balance
      const balanceResult = await client.query(
        `SELECT available_days, used_days FROM employee_leave_balance 
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
        [employeeId, leaveTypeId, new Date().getFullYear()]
      );

      if (balanceResult.rows.length === 0) {
        throw new Error('No leave balance found for this leave type');
      }

      const remaining = balanceResult.rows[0].available_days - balanceResult.rows[0].used_days;
      if (remaining < totalDays) {
        throw new Error(`Insufficient leave balance. Available: ${remaining} days`);
      }

      // Create leave application
      const result = await client.query(
        `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [employeeId, leaveTypeId, fromDate, toDate, totalDays, reason, 'PENDING']
      );

      const leaveId = result.rows[0].id;

      // Log audit
      await logAudit('LEAVE_APPLICATION_CREATED', 'leave_application', leaveId, employeeId, null, result.rows[0], 'SUCCESS');

      // Create notification for manager
      const empResult = await client.query(
        `SELECT reporting_manager_id FROM users WHERE id = $1`,
        [employeeId]
      );
      
      if (empResult.rows[0]?.reporting_manager_id) {
        await createNotification(
          empResult.rows[0].reporting_manager_id,
          'New Leave Request',
          `Employee has requested ${totalDays} days of leave`,
          'LEAVE_REQUEST',
          leaveId,
          'leave_application'
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get employee's leave applications
  static async getEmployeeLeaves(employeeId, status = null) {
    let query = `
      SELECT 
        la.*,
        lt.leave_name,
        lt.total_days as leave_type_days,
        e.name as employee_name
      FROM leave_applications la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN users e ON la.employee_id = e.id
      WHERE la.employee_id = $1
    `;
    const params = [employeeId];

    if (status) {
      query += ` AND la.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY la.created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get leave balance for employee
  static async getLeaveBalance(employeeId, year = null) {
    year = year || new Date().getFullYear();
    
    // Ensure leave balances are initialized for this year
    const checkBalanceExist = await db.query(
      `SELECT COUNT(*) FROM employee_leave_balance WHERE employee_id = $1 AND year = $2`,
      [employeeId, year]
    );
    if (parseInt(checkBalanceExist.rows[0].count) === 0) {
      const leaveTypes = await db.query(`SELECT id, total_days FROM leave_types`);
      for (const type of leaveTypes.rows) {
        await db.query(
          `INSERT INTO employee_leave_balance (employee_id, leave_type_id, available_days, used_days, year)
           VALUES ($1, $2, $3, 0, $4)
           ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
          [employeeId, type.id, type.total_days, year]
        );
      }
    }
    
    const result = await db.query(
      `SELECT 
        elb.*,
        lt.leave_name,
        lt.total_days,
        (elb.available_days - elb.used_days) as remaining_days
      FROM employee_leave_balance elb
      JOIN leave_types lt ON elb.leave_type_id = lt.id
      WHERE elb.employee_id = $1 AND elb.year = $2
      ORDER BY lt.leave_name`,
      [employeeId, year]
    );
    
    return result.rows;
  }

  // Get pending leave applications for manager/hr
  static async getPendingLeaves(role, userId, departmentId = null) {
    let query = `
      SELECT 
        la.*,
        lt.leave_name,
        e.name as employee_name,
        e.email as employee_email,
        d.department_name
      FROM leave_applications la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN users e ON la.employee_id = e.id
      LEFT JOIN employee_profiles ep ON e.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE la.status = 'PENDING'
    `;
    const params = [];

    if (role === 'MANAGER') {
      query += ` AND e.reporting_manager_id = $1`;
      params.push(userId);
    } else if (role === 'HR') {
      if (departmentId) {
        query += ` AND ep.department_id = $1`;
        params.push(departmentId);
      }
    }

    query += ` ORDER BY la.created_at ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Approve leave (with transaction)
  static async approveLeave(leaveId, approvedBy, role, remarks = '') {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get leave application
      const leaveResult = await client.query(
        `SELECT * FROM leave_applications WHERE id = $1`,
        [leaveId]
      );

      if (leaveResult.rows.length === 0) {
        throw new Error('Leave application not found');
      }

      const leave = leaveResult.rows[0];

      // Update leave status
      const updateResult = await client.query(
        `UPDATE leave_applications 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        ['APPROVED', leaveId]
      );

      // Record approval in history
      await client.query(
        `INSERT INTO approval_history (leave_id, approved_by, approval_level, action, remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [leaveId, approvedBy, role, 'APPROVED', remarks]
      );

      // Update leave balance (deduct used days for the employee)
      await client.query(
        `UPDATE employee_leave_balance 
         SET used_days = used_days + $1, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [leave.total_days, leave.employee_id, leave.leave_type_id, new Date().getFullYear()]
      );

      // Log audit
      await logAudit('LEAVE_APPROVED', 'leave_application', leaveId, approvedBy, leave, updateResult.rows[0], 'SUCCESS');

      // Create notification for employee
      await createNotification(
        leave.employee_id,
        'Leave Approved',
        `Your leave request has been approved by ${role}`,
        'LEAVE_APPROVED',
        leaveId,
        'leave_application'
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject leave
  static async rejectLeave(leaveId, rejectedBy, role, remarks = '') {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get leave application
      const leaveResult = await client.query(
        `SELECT * FROM leave_applications WHERE id = $1`,
        [leaveId]
      );

      if (leaveResult.rows.length === 0) {
        throw new Error('Leave application not found');
      }

      const leave = leaveResult.rows[0];

      // Update leave status
      const updateResult = await client.query(
        `UPDATE leave_applications 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        ['REJECTED', leaveId]
      );

      // Record rejection in history
      await client.query(
        `INSERT INTO approval_history (leave_id, approved_by, approval_level, action, remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [leaveId, rejectedBy, role, 'REJECTED', remarks]
      );

      // Log audit
      await logAudit('LEAVE_REJECTED', 'leave_application', leaveId, rejectedBy, leave, updateResult.rows[0], 'SUCCESS');

      // Create notification for employee
      await createNotification(
        leave.employee_id,
        'Leave Rejected',
        `Your leave request has been rejected by ${role}. Reason: ${remarks}`,
        'LEAVE_REJECTED',
        leaveId,
        'leave_application'
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get approval history
  static async getApprovalHistory(leaveId) {
    const result = await db.query(
      `SELECT 
        ah.*,
        e.name as approver_name
      FROM approval_history ah
      LEFT JOIN users e ON ah.approved_by = e.id
      WHERE ah.leave_id = $1
      ORDER BY ah.created_at ASC`,
      [leaveId]
    );
    
    return result.rows;
  }

  // Get audit logs
  static async getAuditLogs(filters = {}) {
    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (filters.entityType) {
      query += ` AND entity_type = $${params.length + 1}`;
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      query += ` AND entity_id = $${params.length + 1}`;
      params.push(filters.entityId);
    }

    if (filters.action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(filters.action);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await db.query(query, params);
    return result.rows;
  }

  // Get leave statistics (for dashboard)
  static async getLeaveStats(departmentId = null) {
    let query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
        COALESCE(SUM(total_days) FILTER (WHERE status = 'APPROVED'), 0) as total_approved_days,
        COALESCE(AVG(total_days) FILTER (WHERE status = 'APPROVED'), 0) as avg_leave_duration
      FROM leave_applications la
      JOIN users e ON la.employee_id = e.id
      LEFT JOIN employee_profiles ep ON e.id = ep.user_id
      WHERE 1=1
    `;
    const params = [];

    if (departmentId) {
      query += ` AND ep.department_id = $1`;
      params.push(departmentId);
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Get leave reports from view
  static async getLeaveReports() {
    const result = await db.query('SELECT * FROM leave_reports ORDER BY employee_name');
    return result.rows;
  }

  // Get advanced SQL analytical reports
  static async getAdvancedReports() {
    // 1. Employee Absence Rank using DENSE_RANK() Window Function
    const rankQuery = `
      SELECT 
        u.id as employee_id,
        u.name as employee_name,
        d.department_name,
        COALESCE(SUM(la.total_days), 0) as total_leave_days,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(la.total_days), 0) DESC) as absence_rank
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      LEFT JOIN leave_applications la ON u.id = la.employee_id AND la.status = 'APPROVED'
      GROUP BY u.id, u.name, d.department_name
      ORDER BY absence_rank ASC
    `;
    const rankResult = await db.query(rankQuery);

    // 2. Monthly Leave Trends
    const trendsQuery = `
      SELECT 
        TO_CHAR(la.from_date, 'YYYY-MM') as month_str,
        COUNT(la.id) as total_requests,
        COUNT(CASE WHEN la.status = 'APPROVED' THEN 1 END) as approved_requests,
        COALESCE(SUM(la.total_days) FILTER (WHERE la.status = 'APPROVED'), 0) as approved_days
      FROM leave_applications la
      GROUP BY TO_CHAR(la.from_date, 'YYYY-MM')
      ORDER BY month_str DESC
    `;
    const trendsResult = await db.query(trendsQuery);

    // 3. Department Wise Leave Stats
    const deptQuery = `
      SELECT 
        d.department_name,
        COUNT(la.id) as total_requests,
        COUNT(CASE WHEN la.status = 'APPROVED' THEN 1 END) as approved_requests,
        COALESCE(SUM(la.total_days) FILTER (WHERE la.status = 'APPROVED'), 0) as total_approved_days
      FROM departments d
      LEFT JOIN employee_profiles ep ON d.id = ep.department_id
      LEFT JOIN users u ON ep.user_id = u.id
      LEFT JOIN leave_applications la ON u.id = la.employee_id
      GROUP BY d.id, d.department_name
      ORDER BY total_approved_days DESC
    `;
    const deptResult = await db.query(deptQuery);

    return {
      rankings: rankResult.rows,
      trends: trendsResult.rows,
      departmentStats: deptResult.rows
    };
  }
}

module.exports = LeaveService;
