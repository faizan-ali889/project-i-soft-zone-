// Leave Routes
const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateLeaveApplication,
  validateApproval,
  validateRejection
} = require('../validators/leave.validator');

// Apply authentication middleware to all leave routes
router.use(authMiddleware);

// Apply for leave (User)
router.post('/apply', validateLeaveApplication, LeaveController.applyLeave);

// Get logged in user's leave application history
router.get('/my-leaves', LeaveController.getMyLeaves);

// Get logged in user's leave balance levels
router.get('/balance', LeaveController.getLeaveBalance);

// Get list of leave types
router.get('/types', LeaveController.getLeaveTypes);

// Get pending applications for review (Admin/HR/Manager)
router.get('/pending', LeaveController.getPendingLeaves);

// Approve leave (Admin/HR/Manager, with validate)
router.put('/:id/approve', validateApproval, LeaveController.approveLeave);

// Reject leave (Admin/HR/Manager, with validate)
router.put('/:id/reject', validateRejection, LeaveController.rejectLeave);

// Get approval history logs
router.get('/:id/approval-history', LeaveController.getApprovalHistory);

// Retrieve complete leaves report from view (Admin/HR only)
router.get('/admin/reports', LeaveController.getLeaveReports);

// Retrieve advanced SQL analytical reports (Admin/HR only)
router.get('/admin/advanced-reports', LeaveController.getAdvancedReports);

// Get leave logs audit trail (Admin/HR only)
router.get('/admin/audit-logs', LeaveController.getAuditLogs);

// Get leave statistics (Admin/HR/Manager)
router.get('/admin/statistics', LeaveController.getLeaveStats);

module.exports = router;
