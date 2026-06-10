// Employee Routes and Upload Configuration
const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateEmployee, validateUpdateEmployee } = require('../validators/employee.validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure standard uploads subdirectories exist
const uploadDir = path.resolve(__dirname, '../uploads/employees');
['employees', 'documents', 'certificates', 'assets'].forEach(folder => {
  const dir = path.resolve(__dirname, `../uploads/${folder}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter (validating extension & mime-type)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Only images are allowed (JPG, JPEG, PNG, WEBP, GIF)'), false);
  }
  
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid image file type'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all employees
router.get('/', EmployeeController.getAllEmployees);

// GET single employee profile
router.get('/:id', EmployeeController.getEmployeeById);

// POST create employee (Admin/HR only, with validator)
router.post('/', authMiddleware, validateCreateEmployee, EmployeeController.createEmployee);

// PUT update employee (Admin/HR only, with validator)
router.put('/:id', authMiddleware, validateUpdateEmployee, EmployeeController.updateEmployee);

// DELETE employee (Admin only)
router.delete('/:id', authMiddleware, EmployeeController.deleteEmployee);

// POST upload images
router.post('/:id/upload', authMiddleware, upload.array('images', 5), EmployeeController.uploadImages);

module.exports = router;