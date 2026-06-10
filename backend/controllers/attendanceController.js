// Attendance Router Controller
const AttendanceService = require('../services/attendanceService');

class AttendanceController {
  // Mark attendance present for logged in user
  static async markAttendance(req, res, next) {
    try {
      const record = await AttendanceService.markAttendance(req.user.id);
      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance: record
      });
    } catch (error) {
      next(error);
    }
  }

  // Get logged-in user's today attendance record
  static async getTodayStatus(req, res, next) {
    try {
      const record = await AttendanceService.getTodayStatus(req.user.id);
      res.status(200).json({
        message: 'Today\'s attendance status retrieved successfully',
        attendance: record
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active attendance window settings
  static async getSettings(req, res, next) {
    try {
      const settings = await AttendanceService.getAttendanceSettings();
      res.status(200).json({
        message: 'Settings retrieved successfully',
        settings
      });
    } catch (error) {
      next(error);
    }
  }

  // Update attendance window settings (Admin only)
  static async updateSettings(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required to change settings' });
      }

      const { startTime, endTime } = req.validatedData;
      const settings = await AttendanceService.updateAttendanceSettings(startTime, endTime);
      res.status(200).json({
        message: 'Attendance settings updated successfully',
        settings
      });
    } catch (error) {
      next(error);
    }
  }

  // Get daily registry logs (Shared view)
  static async getRegistry(req, res, next) {
    try {
      const { date } = req.query;
      const registry = await AttendanceService.getDailyRegistry(date);
      res.status(200).json({
        message: 'Attendance registry retrieved successfully',
        count: registry.length,
        registry
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttendanceController;
