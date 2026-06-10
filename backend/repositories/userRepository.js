// User Database Repository
const db = require('../config/db');

class UserRepository {
  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, role, reporting_manager_id FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async createUser(name, email, hashedPassword, role, reportingManagerId) {
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, reporting_manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role || 'EMPLOYEE', reportingManagerId || null]
    );
    return result.rows[0];
  }

  static async updateUser(id, updateData) {
    const fields = [];
    const values = [];

    Object.entries(updateData).forEach(([key, val]) => {
      if (['role', 'reporting_manager_id', 'name', 'email'].includes(key)) {
        values.push(val);
        fields.push(`${key} = $${values.length}`);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async getAllUsers() {
    const result = await db.query('SELECT id, name, email, role FROM users ORDER BY name');
    return result.rows;
  }
}

module.exports = UserRepository;
