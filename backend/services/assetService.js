const db = require('../config/db');

// Helper: Log to audit trail
const logAudit = async (action, entityType, entityId, performedBy, oldValues = null, newValues = null, status = 'SUCCESS') => {
  try {
    await db.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, old_values, new_values, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, entityType, entityId, performedBy, JSON.stringify(oldValues), JSON.stringify(newValues), status]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

// Helper: Create notification
const createNotification = async (userId, title, message, type, referenceId = null, referenceType = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, message, type, referenceId, referenceType]
    );
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

class AssetService {
  // Get all assets with pagination, filtering, and sorting
  static async getAllAssets(filters = {}) {
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
    
    // Count query for pagination meta
    let countQuery = query.replace('SELECT * FROM assets', 'SELECT COUNT(*) FROM assets');
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);
    
    // Sort logic
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

  // Get single asset by ID
  static async getAssetById(id) {
    const result = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('Asset not found');
    }
    return result.rows[0];
  }

  // Create new asset
  static async createAsset(assetData, performedBy) {
    const { assetName, assetType, serialNumber } = assetData;
    
    const checkSerial = await db.query('SELECT id FROM assets WHERE serial_number = $1', [serialNumber]);
    if (checkSerial.rows.length > 0) {
      throw new Error('Asset with this serial number already exists');
    }

    const result = await db.query(
      `INSERT INTO assets (asset_name, asset_type, serial_number, status)
       VALUES ($1, $2, $3, 'AVAILABLE') RETURNING *`,
      [assetName, assetType, serialNumber]
    );

    const asset = result.rows[0];
    
    // Log audit trail
    await logAudit('ASSET_CREATED', 'asset', asset.id, performedBy, null, asset, 'SUCCESS');
    
    return asset;
  }

  // Allocate asset to employee (with database transaction)
  static async allocateAsset(allocationData, performedBy) {
    const { assetId, employeeId, remarks } = allocationData;
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get and verify asset availability
      const assetResult = await client.query('SELECT * FROM assets WHERE id = $1', [assetId]);
      if (assetResult.rows.length === 0) {
        throw new Error('Asset not found');
      }
      const asset = assetResult.rows[0];
      if (asset.status !== 'AVAILABLE') {
        throw new Error(`Asset is currently not available. Status: ${asset.status}`);
      }
      
      // 2. Verify employee exists
      const empResult = await client.query('SELECT id, name FROM users WHERE id = $1', [employeeId]);
      if (empResult.rows.length === 0) {
        throw new Error('Employee not found');
      }
      const employee = empResult.rows[0];
      
      // 3. Create allocation entry
      const allocResult = await client.query(
        `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, status, remarks)
         VALUES ($1, $2, $3, 'ALLOCATED', $4) RETURNING *`,
        [assetId, employeeId, performedBy, remarks || '']
      );
      const allocation = allocResult.rows[0];
      
      // 4. Update asset status
      const updatedAssetResult = await client.query(
        `UPDATE assets SET status = 'ALLOCATED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [assetId]
      );
      const updatedAsset = updatedAssetResult.rows[0];
      
      // 5. Log audit trail with JSONB old and new values
      await logAudit(
        'ASSET_ALLOCATED',
        'asset',
        assetId,
        performedBy,
        { id: asset.id, status: asset.status },
        { id: updatedAsset.id, status: updatedAsset.status, allocation_id: allocation.id, employee_id: employeeId },
        'SUCCESS'
      );
      
      // 6. Create employee notification
      await createNotification(
        employeeId,
        'Asset Allocated',
        `A new asset (${asset.asset_name} - Serial: ${asset.serial_number}) has been allocated to you.`,
        'ASSET_ALLOCATION',
        allocation.id,
        'asset_allocation'
      );
      
      await client.query('COMMIT');
      return allocation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Return asset (with database transaction)
  static async returnAsset(returnData, performedBy) {
    const { allocationId, remarks } = returnData;
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get and verify active allocation
      const allocResult = await client.query('SELECT * FROM asset_allocations WHERE id = $1', [allocationId]);
      if (allocResult.rows.length === 0) {
        throw new Error('Allocation record not found');
      }
      const allocation = allocResult.rows[0];
      if (allocation.status !== 'ALLOCATED') {
        throw new Error('This asset has already been returned');
      }
      
      // 2. Get asset details
      const assetResult = await client.query('SELECT * FROM assets WHERE id = $1', [allocation.asset_id]);
      const asset = assetResult.rows[0];
      
      // 3. Update allocation status
      const updatedAllocResult = await client.query(
        `UPDATE asset_allocations 
         SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP, remarks = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [remarks || allocation.remarks, allocationId]
      );
      const updatedAllocation = updatedAllocResult.rows[0];
      
      // 4. Update asset status to AVAILABLE
      const updatedAssetResult = await client.query(
        `UPDATE assets SET status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [allocation.asset_id]
      );
      const updatedAsset = updatedAssetResult.rows[0];
      
      // 5. Log audit trail
      await logAudit(
        'ASSET_RETURNED',
        'asset',
        allocation.asset_id,
        performedBy,
        { id: asset.id, status: asset.status, allocation_id: allocationId },
        { id: updatedAsset.id, status: updatedAsset.status, return_remarks: remarks },
        'SUCCESS'
      );
      
      // 6. Create employee notification
      await createNotification(
        allocation.employee_id,
        'Asset Returned',
        `The asset (${asset.asset_name}) allocated to you has been marked as returned.`,
        'ASSET_RETURN',
        allocationId,
        'asset_allocation'
      );
      
      await client.query('COMMIT');
      return updatedAllocation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get assets allocated to a specific employee
  static async getEmployeeAllocations(employeeId) {
    const result = await db.query(
      `SELECT * FROM asset_reports 
       WHERE employee_id = $1 AND allocation_status = 'ALLOCATED'
       ORDER BY allocated_at DESC`,
      [employeeId]
    );
    return result.rows;
  }

  // Get complete assets reports (Admin/HR only)
  static async getAssetReports() {
    const result = await db.query('SELECT * FROM asset_reports ORDER BY allocated_at DESC');
    return result.rows;
  }
}

module.exports = AssetService;
