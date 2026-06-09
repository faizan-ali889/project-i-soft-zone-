const AssetService = require('../services/assetService');

class AssetController {
  // Get all assets
  static async getAllAssets(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        assetType: req.query.assetType,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await AssetService.getAllAssets(filters);
      res.json({
        message: 'Assets retrieved successfully',
        ...result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new asset (Admin/HR only)
  static async createAsset(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Only Admin and HR can create assets' });
      }

      const asset = await AssetService.createAsset(req.validatedData, req.user.id);
      res.status(201).json({
        message: 'Asset created successfully',
        asset
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Allocate asset (Admin/HR only)
  static async allocateAsset(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Only Admin and HR can allocate assets' });
      }

      const allocation = await AssetService.allocateAsset(req.validatedData, req.user.id);
      res.status(201).json({
        message: 'Asset allocated successfully',
        allocation
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Return asset (Admin/HR only)
  static async returnAsset(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Only Admin and HR can mark assets as returned' });
      }

      const returnRecord = await AssetService.returnAsset(req.validatedData, req.user.id);
      res.json({
        message: 'Asset returned successfully',
        allocation: returnRecord
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get active user's allocations (available to any authenticated user)
  static async getMyAllocations(req, res) {
    try {
      const allocations = await AssetService.getEmployeeAllocations(req.user.id);
      res.json({
        message: 'Your asset allocations retrieved successfully',
        count: allocations.length,
        allocations
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get asset reports (Admin/HR only)
  static async getAssetReports(req, res) {
    try {
      if (!['ADMIN', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized: Only Admin and HR can view asset reports' });
      }

      const reports = await AssetService.getAssetReports();
      res.json({
        message: 'Asset reports retrieved successfully',
        count: reports.length,
        reports
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AssetController;
