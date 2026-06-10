// Leave Database Repository
const db = require('../config/db');

class LeaveRepository {
  static async getTransactionClient() {
    return await db.connect();
  }

  static async getLeaveTypes(client = db) {
    const result = await client.query(`SELECT id, total_days FROM leave_types`);
    return result.rows;
  }

  static async checkLeaveBalanceInitialized(employeeId, year, client = db) {
    const result = await client.query(
      `SELECT COUNT(*) FROM employee_leave_balance WHERE employee_id = $1 AND year = $2`,
      [employeeId, year]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  static async initializeLeaveBalance(employeeId, leaveTypeId, totalDays, year, client = db) {
    await client.query(
      `INSERT INTO employee_leave_balance (employee_id, leave_type_id, available_days, used_days, year)
       VALUES ($1, $2, $3, 0, $4)
       ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
      [employeeId, leaveTypeId, totalDays, year]
    );
  }

  static async getLeaveBalance(employeeId, leaveTypeId, year, client = db) {
    const result = await client.query(
      `SELECT available_days, used_days FROM employee_leave_balance 
       WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
      [employeeId, leaveTypeId, year]
    );
    return result.rows[0];
  }

  static async createLeaveApplication(employeeId, leaveTypeId, fromDate, toDate, totalDays, reason, client = db) {
    const result = await client.query(
      `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [employeeId, leaveTypeId, fromDate, toDate, totalDays, reason]
    );
    return result.rows[0];
  }

  static async logAudit(action, entityType, entityId, performedBy, oldValues, newValues, status, client = db) {
    await client.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, old_values, new_values, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, entityType, entityId, performedBy, JSON.stringify(oldValues), JSON.stringify(newValues), status]
    );
  }

  static async getManagerId(employeeId, client = db) {
    const result = await client.query(
      `SELECT reporting_manager_id FROM users WHERE id = $1`,
      [employeeId]
    );
    return result.rows[0]?.reporting_manager_id;
  }

  static async createNotification(userId, title, message, type, referenceId, referenceType, client = db) {
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, message, type, referenceId, referenceType]
    );
  }

  static async getEmployeeLeaves(employeeId, status) {
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

  static async getLeaveBalancesForYear(employeeId, year) {
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

  static async getPendingLeaves(role, userId, departmentId) {
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

  static async getById(id, client = db) {
    const result = await client.query(
      `SELECT * FROM leave_applications WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, client = db) {
    const result = await client.query(
      `UPDATE leave_applications 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async recordApprovalHistory(leaveId, approvedBy, role, action, remarks, client = db) {
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, approval_level, action, remarks)
       VALUES ($1, $2, $3, $4, $5)`,
      [leaveId, approvedBy, role, action, remarks]
    );
  }

  static async updateUsedLeaveDays(employeeId, leaveTypeId, year, days, client = db) {
    await client.query(
      `UPDATE employee_leave_balance 
       SET used_days = used_days + $1, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
      [days, employeeId, leaveTypeId, year]
    );
  }

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

  static async getLeaveReports() {
    const result = await db.query('SELECT * FROM leave_reports ORDER BY employee_name');
    return result.rows;
  }

  static async getAdvancedReports() {
    // absence rank using DENSE_RANK()
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

    // monthly leave trends
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

    // department wise leave stats
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

module.exports = LeaveRepository;
