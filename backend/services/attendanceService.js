// Attendance Business Logic Service calling Repository Layer
const AttendanceRepository = require('../repositories/attendanceRepository');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class AttendanceService {
  // Mark Attendance (Clock-in during window)
  static async markAttendance(userId) {
    const client = await AttendanceRepository.getTransactionClient();
    try {
      await client.query('BEGIN');

      // 1. Fetch settings
      const settings = await AttendanceRepository.getSettings(client);
      if (!settings) {
        throw new ValidationError('Attendance settings have not been configured.');
      }

      const { start_time, end_time } = settings;

      // Parse start and end times
      const now = new Date();
      const [startH, startM, startS] = start_time.split(':').map(Number);
      const [endH, endM, endS] = end_time.split(':').map(Number);

      const startTimeObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, startS || 0);
      const endTimeObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, endS || 0);

      // Validate current time is within window
      if (now < startTimeObj) {
        throw new ValidationError(`Attendance window is not open yet. It opens at ${start_time}.`);
      }
      if (now > endTimeObj) {
        throw new ValidationError(`Attendance window is closed. It closed at ${end_time}.`);
      }

      // 2. Check if user already marked attendance today
      const existing = await AttendanceRepository.getTodayRecord(userId, client);
      if (existing) {
        throw new ValidationError('You have already marked your attendance for today.');
      }

      // 3. Mark attendance
      const record = await AttendanceRepository.createRecord(userId, client);

      await client.query('COMMIT');
      logger.info(`Attendance marked present today for User ID ${userId}`);
      return record;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user's today status
  static async getTodayStatus(userId) {
    return await AttendanceRepository.getTodayRecord(userId);
  }

  // Get active attendance settings
  static async getAttendanceSettings() {
    const settings = await AttendanceRepository.getSettings();
    if (!settings) {
      throw new NotFoundError('Attendance settings not found');
    }
    return settings;
  }

  // Update attendance settings (Admin only)
  static async updateAttendanceSettings(startTime, endTime) {
    const settings = await AttendanceRepository.updateSettings(startTime, endTime);
    logger.info(`Attendance settings updated: ${startTime} - ${endTime}`);
    return settings;
  }

  // Get daily registry for all users (Shared list)
  static async getDailyRegistry(date = null) {
    const queryDate = date || new Date().toISOString().split('T')[0];
    return await AttendanceRepository.getDailyRegistry(queryDate);
  }
}

module.exports = AttendanceService;
