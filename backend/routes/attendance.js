const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/mark', AttendanceController.markAttendance);
router.get('/today', AttendanceController.getTodayStatus);
router.get('/settings', AttendanceController.getSettings);
router.put('/settings', AttendanceController.updateSettings);
router.get('/registry', AttendanceController.getDailyRegistry);

module.exports = router;
