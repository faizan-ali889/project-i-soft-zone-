// Asset Database Repository
const db = require('../config/db');

class AssetRepository {
  static async getTransactionClient() {
    return await db.connect();
  }

  static async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM assets WHERE 1=1`;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.assetType) {
      params.push(filters.assetType);
      query += ` AND asset_type = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (asset_name ILIKE $${params.length} OR serial_number ILIKE $${params.length})`;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS temp`;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Sort order
    const sortBy = ['asset_name', 'asset_type', 'status', 'created_at'].includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      assets: result.rows,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    };
  }

  static async getById(id, client = db) {
    const result = await client.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findBySerialNumber(serialNumber) {
    const result = await db.query('SELECT id FROM assets WHERE serial_number = $1', [serialNumber]);
    return result.rows[0];
  }

  static async create(assetName, assetType, serialNumber) {
    const result = await db.query(
      `INSERT INTO assets (asset_name, asset_type, serial_number, status)
       VALUES ($1, $2, $3, 'AVAILABLE') RETURNING *`,
      [assetName, assetType, serialNumber]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, client = db) {
    const result = await client.query(
      `UPDATE assets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async getAllocationById(id, client = db) {
    const result = await client.query('SELECT * FROM asset_allocations WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createAllocation(assetId, employeeId, allocatedBy, remarks, client = db) {
    const result = await client.query(
      `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, status, remarks)
       VALUES ($1, $2, $3, 'ALLOCATED', $4) RETURNING *`,
      [assetId, employeeId, allocatedBy, remarks || '']
    );
    return result.rows[0];
  }

  static async updateAllocationReturn(id, remarks, client = db) {
    const result = await client.query(
      `UPDATE asset_allocations 
       SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP, remarks = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [remarks, id]
    );
    return result.rows[0];
  }

  static async getEmployeeAllocations(employeeId) {
    const result = await db.query(
      `SELECT * FROM asset_reports 
       WHERE employee_id = $1 AND allocation_status = 'ALLOCATED'
       ORDER BY allocated_at DESC`,
      [employeeId]
    );
    return result.rows;
  }

  static async getAssetReports() {
    const result = await db.query('SELECT * FROM asset_reports ORDER BY allocated_at DESC');
    return result.rows;
  }
}

module.exports = AssetRepository;
