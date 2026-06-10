// Asset Business Logic Service calling Repository Layer
const AssetRepository = require('../repositories/assetRepository');
const UserRepository = require('../repositories/userRepository');
const EmailService = require('./emailService');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../config/logger');

// Helper: Log to audit trail
const logAudit = async (action, entityType, entityId, performedBy, oldValues = null, newValues = null, status = 'SUCCESS', client = undefined) => {
  try {
    await AssetRepository.logAudit(action, entityType, entityId, performedBy, oldValues, newValues, status, client);
  } catch (error) {
    logger.error('Audit logging error:', error);
  }
};

// Helper: Create notification
const createNotification = async (userId, title, message, type, referenceId = null, referenceType = null, client = undefined) => {
  try {
    await AssetRepository.createNotification(userId, title, message, type, referenceId, referenceType, client);
  } catch (error) {
    logger.error('Notification creation error:', error);
  }
};

class AssetService {
  // Get all assets with pagination, filtering, and sorting
  static async getAllAssets(filters = {}) {
    return await AssetRepository.getAll(filters);
  }

  // Get single asset by ID
  static async getAssetById(id) {
    const asset = await AssetRepository.getById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return asset;
  }

  // Create new asset
  static async createAsset(assetData, performedBy) {
    const { assetName, assetType, serialNumber } = assetData;
    
    const checkSerial = await AssetRepository.findBySerialNumber(serialNumber);
    if (checkSerial) {
      throw new ConflictError('Asset with this serial number already exists');
    }

    const asset = await AssetRepository.create(assetName, assetType, serialNumber);
    
    // Log audit trail
    await logAudit('ASSET_CREATED', 'asset', asset.id, performedBy, null, asset, 'SUCCESS');
    
    return asset;
  }

  // Allocate asset to employee (with database transaction in Repository)
  static async allocateAsset(allocationData, performedBy) {
    const { assetId, employeeId, remarks } = allocationData;
    const client = await AssetRepository.getTransactionClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get and verify asset availability
      const asset = await AssetRepository.getById(assetId, client);
      if (!asset) {
        throw new NotFoundError('Asset not found');
      }
      if (asset.status !== 'AVAILABLE') {
        throw new ValidationError(`Asset is currently not available. Status: ${asset.status}`);
      }
      
      // 2. Verify employee exists
      const employee = await UserRepository.findById(employeeId);
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      
      // 3. Create allocation entry
      const allocation = await AssetRepository.createAllocation(assetId, employeeId, performedBy, remarks, client);
      
      // 4. Update asset status
      const updatedAsset = await AssetRepository.updateStatus(assetId, 'ALLOCATED', client);
      
      // 5. Log audit trail
      await logAudit(
        'ASSET_ALLOCATED',
        'asset',
        assetId,
        performedBy,
        { id: asset.id, status: asset.status },
        { id: updatedAsset.id, status: updatedAsset.status, allocation_id: allocation.id, employee_id: employeeId },
        'SUCCESS',
        client
      );
      
      // 6. Create employee notification
      await createNotification(
        employeeId,
        'Asset Allocated',
        `A new asset (${asset.asset_name} - Serial: ${asset.serial_number}) has been allocated to you.`,
        'ASSET_ALLOCATION',
        allocation.id,
        'asset_allocation',
        client
      );
      
      await client.query('COMMIT');

      // Trigger email notification asynchronously
      EmailService.sendAssetAssignedEmail(employee.email, employee.name, asset);

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
    const client = await AssetRepository.getTransactionClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get and verify active allocation
      const allocation = await AssetRepository.getAllocationById(allocationId, client);
      if (!allocation) {
        throw new NotFoundError('Allocation record not found');
      }
      if (allocation.status !== 'ALLOCATED') {
        throw new ValidationError('This asset has already been returned');
      }
      
      // 2. Get asset details
      const asset = await AssetRepository.getById(allocation.asset_id, client);
      
      // 3. Update allocation status
      const updatedAllocation = await AssetRepository.updateAllocationReturn(allocationId, remarks || allocation.remarks, client);
      
      // 4. Update asset status to AVAILABLE
      const updatedAsset = await AssetRepository.updateStatus(allocation.asset_id, 'AVAILABLE', client);
      
      // 5. Log audit trail
      await logAudit(
        'ASSET_RETURNED',
        'asset',
        allocation.asset_id,
        performedBy,
        { id: asset.id, status: asset.status, allocation_id: allocationId },
        { id: updatedAsset.id, status: updatedAsset.status, return_remarks: remarks },
        'SUCCESS',
        client
      );
      
      // 6. Create employee notification
      await createNotification(
        allocation.employee_id,
        'Asset Returned',
        `The asset (${asset.asset_name}) allocated to you has been marked as returned.`,
        'ASSET_RETURN',
        allocationId,
        'asset_allocation',
        client
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
    return await AssetRepository.getEmployeeAllocations(employeeId);
  }

  // Get complete assets reports (Admin/HR only)
  static async getAssetReports() {
    return await AssetRepository.getAssetReports();
  }
}

module.exports = AssetService;
