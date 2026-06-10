// Department Routes
const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateDepartment } = require('../validators/department.validator');

// GET all departments (available publicly or authenticated, typically auth required)
router.get('/', DepartmentController.getAllDepartments);

// POST create department (Admin only, auth + validate)
router.post('/', authMiddleware, validateDepartment, DepartmentController.createDepartment);

// PUT update department (Admin only, auth + validate)
router.put('/:id', authMiddleware, validateDepartment, DepartmentController.updateDepartment);

// DELETE department (Admin only)
router.delete('/:id', authMiddleware, DepartmentController.deleteDepartment);

module.exports = router;