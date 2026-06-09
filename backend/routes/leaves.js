const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateLeaveApplication,
  validateApproval,
  validateRejection
} = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

// ========== EMPLOYEE ROUTES ==========
// Apply for leave
router.post('/apply', validateLeaveApplication, LeaveController.applyLeave);

// Get my leave applications
router.get('/my-leaves', LeaveController.getMyLeaves);

// Get my leave balance
router.get('/balance', LeaveController.getLeaveBalance);

// Get leave types
router.get('/types', LeaveController.getLeaveTypes);

// Get my notifications
router.get('/notifications', LeaveController.getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', LeaveController.markNotificationRead);

// ========== MANAGER/HR ROUTES ==========
// Get pending leaves (for approval)
router.get('/pending', LeaveController.getPendingLeaves);

// Approve leave
router.put('/:leaveId/approve', validateApproval, LeaveController.approveLeave);

// Reject leave
router.put('/:leaveId/reject', validateRejection, LeaveController.rejectLeave);

// Get approval history for a leave
router.get('/:leaveId/approval-history', LeaveController.getApprovalHistory);

// ========== ADMIN ROUTES ==========
// Get audit logs
router.get('/admin/audit-logs', LeaveController.getAuditLogs);

// Get leave statistics
router.get('/admin/statistics', LeaveController.getLeaveStats);

// Get leave reports
router.get('/admin/reports', LeaveController.getLeaveReports);

// Get advanced SQL analytics reports
router.get('/admin/advanced-reports', LeaveController.getAdvancedReports);

module.exports = router;
