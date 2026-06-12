// Employee Database Repository
const db = require('../config/db');

class EmployeeRepository {
  static async verifyProfileExists(userId) {
    const result = await db.query('SELECT id FROM employee_profiles WHERE user_id = $1', [userId]);
    return result.rows.length > 0;
  }

  static async createProfile(userId, departmentId, phone, address, designation, salary) {
    const result = await db.query(
      `INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, departmentId, phone, address, designation, salary]
    );
    return result.rows[0];
  }

  static async linkSkills(employeeId, skillIds) {
    if (!skillIds || skillIds.length === 0) return;
    for (const skillId of skillIds) {
      await db.query(
        'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [employeeId, skillId]
      );
    }
  }

  static async clearSkills(employeeId) {
    await db.query('DELETE FROM employee_skills WHERE employee_id = $1', [employeeId]);
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT 
         ep.id,
         ep.user_id,
         ep.phone,
         ep.address,
         ep.designation,
         ep.salary,
         ep.created_at,
         ep.department_id,
         u.name as employee_name,
         u.email,
         u.role,
         u.reporting_manager_id,
         m.name as manager_name,
         d.department_name
       FROM employee_profiles ep
       INNER JOIN users u ON ep.user_id = u.id
       LEFT JOIN users m ON u.reporting_manager_id = m.id
       INNER JOIN departments d ON ep.department_id = d.id
       WHERE ep.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getSkills(id) {
    const result = await db.query(
      `SELECT s.id, s.skill_name
       FROM employee_skills es
       INNER JOIN skills s ON es.skill_id = s.id
       WHERE es.employee_id = $1`,
      [id]
    );
    return result.rows;
  }

  static async getImages(id) {
    const result = await db.query(
      'SELECT id, image_url FROM employee_images WHERE employee_id = $1',
      [id]
    );
    return result.rows;
  }

  static async insertImage(employeeId, imageUrl) {
    const result = await db.query(
      'INSERT INTO employee_images (employee_id, image_url) VALUES ($1, $2) RETURNING *',
      [employeeId, imageUrl]
    );
    return result.rows[0];
  }

  static async getDocuments(employeeId) {
    const result = await db.query(
      'SELECT id, document_name, file_path, document_type, uploaded_at FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC',
      [employeeId]
    );
    return result.rows;
  }

  static async insertDocument(employeeId, documentName, filePath, documentType) {
    const result = await db.query(
      `INSERT INTO employee_documents (employee_id, document_name, file_path, document_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [employeeId, documentName, filePath, documentType]
    );
    return result.rows[0];
  }

  static async getDocumentById(documentId) {
    const result = await db.query(
      'SELECT id, employee_id, document_name, file_path, document_type, uploaded_at FROM employee_documents WHERE id = $1',
      [documentId]
    );
    return result.rows[0];
  }

  static async deleteDocument(documentId) {
    const result = await db.query(
      'DELETE FROM employee_documents WHERE id = $1 RETURNING *',
      [documentId]
    );
    return result.rows[0];
  }

  static async updateProfile(id, departmentId, phone, address, designation, salary) {
    const result = await db.query(
      `UPDATE employee_profiles 
       SET department_id = $1, phone = $2, address = $3, designation = $4, salary = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [departmentId, phone, address, designation, salary, id]
    );
    return result.rows[0];
  }

  static async deleteProfile(id) {
    const result = await db.query(
      'DELETE FROM employee_profiles WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getAllEmployees(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ep.id,
        ep.phone,
        ep.address,
        ep.designation,
        ep.salary,
        ep.created_at,
        u.id as user_id,
        u.name as employee_name,
        u.email,
        u.role,
        u.reporting_manager_id,
        m.name as manager_name,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      LEFT JOIN users m ON u.reporting_manager_id = m.id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.departmentId) {
      params.push(filters.departmentId);
      query += ` AND ep.department_id = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR ep.designation ILIKE $${params.length})`;
    }

    // Count query for pagination meta
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS temp`;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Sort order
    const sortBy = ['employee_name', 'designation', 'salary', 'department_name'].includes(filters.sortBy) ? filters.sortBy : 'ep.id';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Map sorting fields to query columns
    const sortColumnMap = {
      employee_name: 'u.name',
      designation: 'ep.designation',
      salary: 'ep.salary',
      department_name: 'd.department_name',
      'ep.id': 'ep.id'
    };

    query += ` ORDER BY ${sortColumnMap[sortBy]} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      employees: result.rows,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    };
  }
}

module.exports = EmployeeRepository;
