const db = require('../config/db');

class AttendanceService {
  // Mark Attendance (Clock-in during window)
  static async markAttendance(userId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch settings
      const settingsRes = await client.query(
        `SELECT start_time, end_time FROM attendance_settings WHERE id = 1`
      );

      if (settingsRes.rows.length === 0) {
        throw new Error('Attendance settings have not been configured.');
      }

      const { start_time, end_time } = settingsRes.rows[0];

      // Parse start and end times
      const now = new Date();
      const [startH, startM, startS] = start_time.split(':').map(Number);
      const [endH, endM, endS] = end_time.split(':').map(Number);

      const startTimeObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, startS || 0);
      const endTimeObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, endS || 0);

      // Validate current time is within window
      if (now < startTimeObj) {
        throw new Error(`Attendance window is not open yet. It opens at ${start_time}.`);
      }
      if (now > endTimeObj) {
        throw new Error(`Attendance window is closed. It closed at ${end_time}.`);
      }

      // 2. Check if user already marked attendance today
      const existing = await client.query(
        `SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE`,
        [userId]
      );

      if (existing.rows.length > 0) {
        throw new Error('You have already marked your attendance for today.');
      }

      // 3. Mark attendance
      const result = await client.query(
        `INSERT INTO attendance (user_id, status, check_in) 
         VALUES ($1, 'PRESENT', CURRENT_TIMESTAMP) 
         RETURNING *`,
        [userId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user's today status
  static async getTodayStatus(userId) {
    const result = await db.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    return result.rows[0] || null;
  }

  // Get active attendance settings
  static async getAttendanceSettings() {
    const result = await db.query(
      `SELECT start_time, end_time FROM attendance_settings WHERE id = 1`
    );
    return result.rows[0] || null;
  }

  // Update attendance settings (Admin only)
  static async updateAttendanceSettings(startTime, endTime) {
    // Basic format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Invalid time format. Use HH:MM or HH:MM:SS.');
    }

    const result = await db.query(
      `UPDATE attendance_settings 
       SET start_time = $1, end_time = $2 
       WHERE id = 1 
       RETURNING *`,
      [startTime, endTime]
    );

    return result.rows[0];
  }

  // Get daily registry for all users (Shared list)
  static async getDailyRegistry(date = null) {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT 
        a.*,
        u.name as employee_name,
        d.department_name,
        ep.designation
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE a.date = $1
      ORDER BY a.check_in DESC`,
      [queryDate]
    );
    return result.rows;
  }
}

module.exports = AttendanceService;
