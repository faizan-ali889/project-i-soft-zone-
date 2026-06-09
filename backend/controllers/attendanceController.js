const AttendanceService = require('../services/attendanceService');

class AttendanceController {
  // Mark Attendance
  static async markAttendance(req, res) {
    try {
      const record = await AttendanceService.markAttendance(req.user.id);
      res.status(201).json({
        message: 'Attendance marked successfully!',
        record
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get Today's Status
  static async getTodayStatus(req, res) {
    try {
      const record = await AttendanceService.getTodayStatus(req.user.id);
      res.status(200).json({
        record
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get Attendance Settings
  static async getSettings(req, res) {
    try {
      const settings = await AttendanceService.getAttendanceSettings();
      res.status(200).json({
        settings
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update Attendance Settings (Admin Only)
  static async updateSettings(req, res) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required.' });
      }

      const { startTime, endTime } = req.body;
      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Start time and End time are required.' });
      }

      const settings = await AttendanceService.updateAttendanceSettings(startTime, endTime);
      res.status(200).json({
        message: 'Attendance settings updated successfully!',
        settings
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get Daily Attendance Registry
  static async getDailyRegistry(req, res) {
    try {
      const { date } = req.query;
      const registry = await AttendanceService.getDailyRegistry(date);
      res.status(200).json({
        registry
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AttendanceController;
