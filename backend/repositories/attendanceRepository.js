// Attendance Database Repository
const db = require('../config/db');

class AttendanceRepository {
  static async getTransactionClient() {
    return await db.connect();
  }

  static async getSettings(client = db) {
    const result = await client.query(
      `SELECT start_time, end_time FROM attendance_settings WHERE id = 1`
    );
    return result.rows[0];
  }

  static async getTodayRecord(userId, client = db) {
    const result = await client.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    return result.rows[0];
  }

  static async createRecord(userId, client = db) {
    const result = await client.query(
      `INSERT INTO attendance (user_id, status, check_in) 
       VALUES ($1, 'PRESENT', CURRENT_TIMESTAMP) 
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  static async updateSettings(startTime, endTime) {
    const result = await db.query(
      `UPDATE attendance_settings 
       SET start_time = $1, end_time = $2 
       WHERE id = 1 
       RETURNING *`,
      [startTime, endTime]
    );
    return result.rows[0];
  }

  static async getDailyRegistry(queryDate) {
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

module.exports = AttendanceRepository;
