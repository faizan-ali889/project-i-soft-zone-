// Department Database Repository
const db = require('../config/db');

class DepartmentRepository {
  static async getAll() {
    const result = await db.query('SELECT * FROM departments ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM departments WHERE department_name = $1', [name]);
    return result.rows[0];
  }

  static async create(name) {
    const result = await db.query(
      'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  static async update(id, name) {
    const result = await db.query(
      'UPDATE departments SET department_name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = DepartmentRepository;
