// Leave Business Logic Service calling Repository Layer
const LeaveRepository = require('../repositories/leaveRepository');
const UserRepository = require('../repositories/userRepository');
const EmailService = require('./emailService');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// Helper: Log to audit trail
const logAudit = async (action, entityType, entityId, performedBy, oldValues = null, newValues = null, status = 'SUCCESS', client = undefined) => {
  try {
    await LeaveRepository.logAudit(action, entityType, entityId, performedBy, oldValues, newValues, status, client);
  } catch (error) {
    logger.error('Audit logging error:', error);
  }
};

// Helper: Create notification
const createNotification = async (userId, title, message, type, referenceId = null, referenceType = null, client = undefined) => {
  try {
    await LeaveRepository.createNotification(userId, title, message, type, referenceId, referenceType, client);
  } catch (error) {
    logger.error('Notification creation error:', error);
  }
};

class LeaveService {
  // Apply for leave
  static async applyLeave(employeeId, leaveTypeId, fromDate, toDate, reason) {
    const client = await LeaveRepository.getTransactionClient();
    try {
      await client.query('BEGIN');

      // Validate dates
      if (new Date(fromDate) > new Date(toDate)) {
        throw new ValidationError('From date must be before to date');
      }

      // Calculate total days
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      const currentYear = new Date().getFullYear();

      // Ensure leave balances are initialized for the current year
      const hasBalance = await LeaveRepository.checkLeaveBalanceInitialized(employeeId, currentYear, client);
      if (!hasBalance) {
        const leaveTypes = await LeaveRepository.getLeaveTypes(client);
        for (const type of leaveTypes) {
          await LeaveRepository.initializeLeaveBalance(employeeId, type.id, type.total_days, currentYear, client);
        }
      }

      // Check leave balance
      const balance = await LeaveRepository.getLeaveBalance(employeeId, leaveTypeId, currentYear, client);
      if (!balance) {
        throw new NotFoundError('No leave balance found for this leave type');
      }

      const remaining = balance.available_days - balance.used_days;
      if (remaining < totalDays) {
        throw new ValidationError(`Insufficient leave balance. Available: ${remaining} days`);
      }

      // Create leave application
      const leave = await LeaveRepository.createLeaveApplication(employeeId, leaveTypeId, fromDate, toDate, totalDays, reason, client);

      // Log audit
      await logAudit('LEAVE_APPLICATION_CREATED', 'leave_application', leave.id, employeeId, null, leave, 'SUCCESS', client);

      // Create notification for manager
      const managerId = await LeaveRepository.getManagerId(employeeId, client);
      if (managerId) {
        await createNotification(
          managerId,
          'New Leave Request',
          `Employee has requested ${totalDays} days of leave`,
          'LEAVE_REQUEST',
          leave.id,
          'leave_application',
          client
        );
      }

      await client.query('COMMIT');
      logger.info(`Leave applied successfully for Employee ID ${employeeId} (LeaveID: ${leave.id})`);
      return leave;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get employee's leave applications
  static async getEmployeeLeaves(employeeId, status = null) {
    return await LeaveRepository.getEmployeeLeaves(employeeId, status);
  }

  // Get leave balance for employee
  static async getLeaveBalance(employeeId, year = null) {
    const currentYear = year || new Date().getFullYear();
    
    // Ensure leave balances are initialized for this year
    const hasBalance = await LeaveRepository.checkLeaveBalanceInitialized(employeeId, currentYear);
    if (!hasBalance) {
      const leaveTypes = await LeaveRepository.getLeaveTypes();
      for (const type of leaveTypes) {
        await LeaveRepository.initializeLeaveBalance(employeeId, type.id, type.total_days, currentYear);
      }
    }
    
    return await LeaveRepository.getLeaveBalancesForYear(employeeId, currentYear);
  }

  // Get pending leave applications for manager/hr
  static async getPendingLeaves(role, userId, departmentId = null) {
    return await LeaveRepository.getPendingLeaves(role, userId, departmentId);
  }

  // Approve leave (with transaction)
  static async approveLeave(leaveId, approvedBy, role, remarks = '') {
    const client = await LeaveRepository.getTransactionClient();
    try {
      await client.query('BEGIN');

      // Get leave application
      const leave = await LeaveRepository.getById(leaveId, client);
      if (!leave) {
        throw new NotFoundError('Leave application not found');
      }

      // Update leave status
      const updatedLeave = await LeaveRepository.updateStatus(leaveId, 'APPROVED', client);

      // Record approval in history
      await LeaveRepository.recordApprovalHistory(leaveId, approvedBy, role, 'APPROVED', remarks, client);

      // Update leave balance (deduct used days for the employee)
      const currentYear = new Date().getFullYear();
      await LeaveRepository.updateUsedLeaveDays(leave.employee_id, leave.leave_type_id, currentYear, leave.total_days, client);

      // Log audit
      await logAudit('LEAVE_APPROVED', 'leave_application', leaveId, approvedBy, leave, updatedLeave, 'SUCCESS', client);

      // Create notification for employee
      await createNotification(
        leave.employee_id,
        'Leave Approved',
        `Your leave request has been approved by ${role}`,
        'LEAVE_APPROVED',
        leaveId,
        'leave_application',
        client
      );

      await client.query('COMMIT');
      logger.info(`Leave approved for application ID ${leaveId} by User ID ${approvedBy} (${role})`);
      
      // Trigger email notification asynchronously
      UserRepository.findById(leave.employee_id).then(user => {
        if (user) {
          LeaveRepository.getLeaveTypes().then(types => {
            const lt = types.find(t => t.id === leave.leave_type_id) || { leave_name: 'Leave' };
            EmailService.sendLeaveStatusEmail(user.email, user.name, { ...leave, leave_name: lt.leave_name }, 'APPROVED', remarks);
          });
        }
      });

      return updatedLeave;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject leave
  static async rejectLeave(leaveId, rejectedBy, role, remarks = '') {
    const client = await LeaveRepository.getTransactionClient();
    try {
      await client.query('BEGIN');

      // Get leave application
      const leave = await LeaveRepository.getById(leaveId, client);
      if (!leave) {
        throw new NotFoundError('Leave application not found');
      }

      // Update leave status
      const updatedLeave = await LeaveRepository.updateStatus(leaveId, 'REJECTED', client);

      // Record rejection in history
      await LeaveRepository.recordApprovalHistory(leaveId, rejectedBy, role, 'REJECTED', remarks, client);

      // Log audit
      await logAudit('LEAVE_REJECTED', 'leave_application', leaveId, rejectedBy, leave, updatedLeave, 'SUCCESS', client);

      // Create notification for employee
      await createNotification(
        leave.employee_id,
        'Leave Rejected',
        `Your leave request has been rejected by ${role}. Reason: ${remarks}`,
        'LEAVE_REJECTED',
        leaveId,
        'leave_application',
        client
      );

      await client.query('COMMIT');
      logger.info(`Leave rejected for application ID ${leaveId} by User ID ${rejectedBy} (${role})`);
      
      // Trigger email notification asynchronously
      UserRepository.findById(leave.employee_id).then(user => {
        if (user) {
          LeaveRepository.getLeaveTypes().then(types => {
            const lt = types.find(t => t.id === leave.leave_type_id) || { leave_name: 'Leave' };
            EmailService.sendLeaveStatusEmail(user.email, user.name, { ...leave, leave_name: lt.leave_name }, 'REJECTED', remarks);
          });
        }
      });

      return updatedLeave;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get approval history
  static async getApprovalHistory(leaveId) {
    return await LeaveRepository.getApprovalHistory(leaveId);
  }

  // Get audit logs
  static async getAuditLogs(filters = {}) {
    return await LeaveRepository.getAuditLogs(filters);
  }

  // Get leave statistics (for dashboard)
  static async getLeaveStats(departmentId = null) {
    return await LeaveRepository.getLeaveStats(departmentId);
  }

  // Get leave reports from view
  static async getLeaveReports() {
    return await LeaveRepository.getLeaveReports();
  }

  // Get advanced SQL analytical reports
  static async getAdvancedReports() {
    return await LeaveRepository.getAdvancedReports();
  }
}

module.exports = LeaveService;
