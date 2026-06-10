// Skill Database Repository
const db = require('../config/db');

class SkillRepository {
  static async getAll() {
    const result = await db.query('SELECT * FROM skills ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM skills WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM skills WHERE skill_name = $1', [name]);
    return result.rows[0];
  }

  static async create(name) {
    const result = await db.query(
      'INSERT INTO skills (skill_name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  static async update(id, name) {
    const result = await db.query(
      'UPDATE skills SET skill_name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM skills WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = SkillRepository;
