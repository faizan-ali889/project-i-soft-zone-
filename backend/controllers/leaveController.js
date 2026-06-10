// Leave Router Controller
const LeaveService = require('../services/leaveService');

class LeaveController {
  // Apply for leave (validated req.body)
  static async applyLeave(req, res, next) {
    try {
      const { leaveTypeId, fromDate, toDate, reason } = req.validatedData;
      const leave = await LeaveService.applyLeave(req.user.id, leaveTypeId, fromDate, toDate, reason);
      res.status(201).json({
        message: 'Leave application submitted successfully',
        leave
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active user's leave history
  static async getMyLeaves(req, res, next) {
    try {
      const { status } = req.query;
      const leaves = await LeaveService.getEmployeeLeaves(req.user.id, status);
      res.status(200).json(leaves);
    } catch (error) {
      next(error);
    }
  }

  // Get active user's leave balances
  static async getLeaveBalance(req, res, next) {
    try {
      const { year } = req.query;
      const balances = await LeaveService.getLeaveBalance(req.user.id, year ? parseInt(year) : null);
      res.status(200).json(balances);
    } catch (error) {
      next(error);
    }
  }

  // Get all leave types configured
  static async getLeaveTypes(req, res, next) {
    try {
      const db = require('../config/db');
      const result = await db.query('SELECT * FROM leave_types ORDER BY leave_name');
      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  // Get pending reviews for HR, MANAGER or ADMIN
  static async getPendingLeaves(req, res, next) {
    try {
      const { role, id } = req.user;
      
      if (!['ADMIN', 'HR', 'MANAGER'].includes(role)) {
        return res.status(403).json({ error: 'Unauthorized: Only Managers, HR, and Admins can access reviews' });
      }

      const { departmentId } = req.query;
      const pending = await LeaveService.getPendingLeaves(role, id, departmentId ? parseInt(departmentId) : null);
      res.status(200).json(pending);
    } catch (error) {
      next(error);
    }
  }

  // Approve a leave application (Admin/HR/Manager)
  static async approveLeave(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.validatedData;
      const updated = await LeaveService.approveLeave(id, req.user.id, req.user.role, remarks || '');
      res.status(200).json({
        message: 'Leave approved successfully',
        leave: updated
      });
    } catch (error) {
      next(error);
    }
  }

  // Reject a leave application (Admin/HR/Manager)
  static async rejectLeave(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.validatedData;
      const updated = await LeaveService.rejectLeave(id, req.user.id, req.user.role, remarks || '');
      res.status(200).json({
        message: 'Leave rejected successfully',
        leave: updated
      });
    } catch (error) {
      next(error);
    }
  }

  // Get approval history logs for a leave application
  static async getApprovalHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await LeaveService.getApprovalHistory(id);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  // Get centralized audit logs (Admin/HR only)
  static async getAuditLogs(req, res, next) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Access restricted to Admin and HR' });
      }

      const filters = {
        action: req.query.action,
        entityType: req.query.entityType,
        entityId: req.query.entityId
      };

      const logs = await LeaveService.getAuditLogs(filters);
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }

  // Get leave statistics (Admin/HR/Manager)
  static async getLeaveStats(req, res, next) {
    try {
      if (!['ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { departmentId } = req.query;
      const stats = await LeaveService.getLeaveStats(departmentId ? parseInt(departmentId) : null);
      res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  // Get leaves report from view (Admin/HR only)
  static async getLeaveReports(req, res, next) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const reports = await LeaveService.getLeaveReports();
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  // Get advanced SQL analytical reports
  static async getAdvancedReports(req, res, next) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const reports = await LeaveService.getAdvancedReports();
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LeaveController;
