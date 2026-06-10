// Attendance Routes
const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateAttendanceSettings } = require('../validators/attendance.validator');

// Apply authentication middleware to all attendance routes
router.use(authMiddleware);

// Mark attendance
router.post('/mark', AttendanceController.markAttendance);

// Get user's today attendance status
router.get('/today', AttendanceController.getTodayStatus);

// Get attendance settings
router.get('/settings', AttendanceController.getSettings);

// Update attendance settings (Admin only, with validation)
router.put('/settings', validateAttendanceSettings, AttendanceController.updateSettings);

// Get daily registry logs
router.get('/registry', AttendanceController.getRegistry);

module.exports = router;
