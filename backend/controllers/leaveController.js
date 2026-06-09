const LeaveService = require('../services/leaveService');
const db = require('../config/db');

class LeaveController {
  // Apply for leave
  static async applyLeave(req, res) {
    try {
      const { leaveTypeId, fromDate, toDate, reason } = req.body;
      const employeeId = req.user.id;

      // Validate input
      if (!leaveTypeId || !fromDate || !toDate || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const leave = await LeaveService.applyLeave(
        employeeId,
        leaveTypeId,
        fromDate,
        toDate,
        reason
      );

      res.status(201).json({
        message: 'Leave application submitted successfully',
        leave
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get employee's leave applications
  static async getMyLeaves(req, res) {
    try {
      const { status } = req.query;
      const employeeId = req.user.id;

      const leaves = await LeaveService.getEmployeeLeaves(employeeId, status);

      res.json({
        message: 'Leave applications retrieved',
        count: leaves.length,
        leaves
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get leave balance
  static async getLeaveBalance(req, res) {
    try {
      const { year } = req.query;
      const employeeId = req.user.id;

      const balance = await LeaveService.getLeaveBalance(employeeId, year ? parseInt(year) : null);

      res.json({
        message: 'Leave balance retrieved',
        year: year || new Date().getFullYear(),
        balance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get pending leaves (for manager/hr)
  static async getPendingLeaves(req, res) {
    try {
      const { departmentId } = req.query;
      const role = req.user.role;
      const userId = req.user.id;

      if (!['MANAGER', 'HR', 'ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Unauthorized to view pending leaves' });
      }

      const leaves = await LeaveService.getPendingLeaves(
        role,
        userId,
        departmentId ? parseInt(departmentId) : null
      );

      res.json({
        message: 'Pending leave applications',
        count: leaves.length,
        leaves
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Approve leave
  static async approveLeave(req, res) {
    try {
      const { leaveId } = req.params;
      const { remarks } = req.body;
      const approvedBy = req.user.id;
      const role = req.user.role;

      if (!['MANAGER', 'HR', 'ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Unauthorized to approve leaves' });
      }

      const leave = await LeaveService.approveLeave(
        parseInt(leaveId),
        approvedBy,
        role,
        remarks || ''
      );

      res.json({
        message: 'Leave approved successfully',
        leave
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Reject leave
  static async rejectLeave(req, res) {
    try {
      const { leaveId } = req.params;
      const { remarks } = req.body;
      const rejectedBy = req.user.id;
      const role = req.user.role;

      if (!['MANAGER', 'HR', 'ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Unauthorized to reject leaves' });
      }

      const leave = await LeaveService.rejectLeave(
        parseInt(leaveId),
        rejectedBy,
        role,
        remarks || ''
      );

      res.json({
        message: 'Leave rejected successfully',
        leave
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get approval history
  static async getApprovalHistory(req, res) {
    try {
      const { leaveId } = req.params;

      const history = await LeaveService.getApprovalHistory(parseInt(leaveId));

      res.json({
        message: 'Approval history retrieved',
        leaveId: parseInt(leaveId),
        history
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get audit logs
  static async getAuditLogs(req, res) {
    try {
      const { entityType, entityId, action } = req.query;

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized to view audit logs' });
      }

      const filters = {};
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = parseInt(entityId);
      if (action) filters.action = action;

      const logs = await LeaveService.getAuditLogs(filters);

      res.json({
        message: 'Audit logs retrieved',
        count: logs.length,
        logs
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get leave statistics
  static async getLeaveStats(req, res) {
    try {
      const { departmentId } = req.query;

      if (!['ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to view statistics' });
      }

      const stats = await LeaveService.getLeaveStats(
        departmentId ? parseInt(departmentId) : null
      );

      res.json({
        message: 'Leave statistics retrieved',
        stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get leave types
  static async getLeaveTypes(req, res) {
    try {
      const result = await db.query(`
        SELECT * FROM leave_types ORDER BY leave_name
      `);

      res.json({
        message: 'Leave types retrieved',
        count: result.rows.length,
        leaveTypes: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get notifications
  static async getNotifications(req, res) {
    try {
      const { isRead } = req.query;
      const userId = req.user.id;

      let query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (isRead !== undefined) {
        query += ` AND is_read = $2`;
        params.push(isRead === 'true');
      }

      query += ` ORDER BY created_at DESC LIMIT 50`;

      const result = await db.query(query, params);

      res.json({
        message: 'Notifications retrieved',
        count: result.rows.length,
        notifications: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Mark notification as read
  static async markNotificationRead(req, res) {
    try {
      const { notificationId } = req.params;

      await db.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [parseInt(notificationId)]
      );

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get leave reports (Admin/HR only)
  static async getLeaveReports(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to view reports' });
      }
      const reports = await LeaveService.getLeaveReports();
      res.json({
        message: 'Leave reports retrieved',
        reports
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get advanced reports (Admin/HR only)
  static async getAdvancedReports(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to view advanced reports' });
      }
      const reports = await LeaveService.getAdvancedReports();
      res.json({
        message: 'Advanced reports retrieved',
        reports
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = LeaveController;
