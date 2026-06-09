const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateAsset,
  validateAssetAllocation,
  validateAssetReturn
} = require('../utils/validation');

// Apply authentication middleware to all asset routes
router.use(authMiddleware);

// Retrieve all assets (filtering/sorting/pagination supported)
router.get('/', AssetController.getAllAssets);

// Retrieve allocations for current logged in user
router.get('/my-allocations', AssetController.getMyAllocations);

// Create new asset (Admin/HR only)
router.post('/', validateAsset, AssetController.createAsset);

// Allocate asset to employee (Admin/HR only)
router.post('/allocate', validateAssetAllocation, AssetController.allocateAsset);

// Return asset from employee (Admin/HR only)
router.post('/return', validateAssetReturn, AssetController.returnAsset);

// Retrieve complete asset reports view (Admin/HR only)
router.get('/reports', AssetController.getAssetReports);

module.exports = router;
