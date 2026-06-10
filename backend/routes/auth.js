// Auth Route Declarations
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateLogin, validateRegister } = require('../validators/auth.validator');

// Register Route
router.post('/register', validateRegister, AuthController.register);

// Login Route
router.post('/login', validateLogin, AuthController.login);

// Get User Profile Route (Protected)
router.get('/user-profile', authMiddleware, AuthController.getUserProfile);

module.exports = router;