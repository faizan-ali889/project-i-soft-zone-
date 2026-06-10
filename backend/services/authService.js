// Auth Business Logic Service
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/userRepository');
const stats = require('../utils/stats');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class AuthService {
  static async register(userData) {
    const { name, email, password, role, reporting_manager_id } = userData;

    // Check if user already exists
    const userExists = await UserRepository.findByEmail(email);
    if (userExists) {
      throw new ConflictError('User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role assignment if none specified
    const assignedRole = role || (email.toLowerCase().includes('admin') ? 'ADMIN' : 'EMPLOYEE');

    // Create user in Repository
    const user = await UserRepository.createUser(name, email, hashedPassword, assignedRole, reporting_manager_id);
    
    logger.info(`User registered successfully: ${email} (${assignedRole})`);
    return user;
  }

  static async login(email, password) {
    // Find user
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      stats.failedLogins++;
      logger.warn(`Failed login attempt: User not found for email ${email}`);
      throw new NotFoundError('User not found');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      stats.failedLogins++;
      logger.warn(`Failed login attempt: Incorrect password for email ${email}`);
      throw new UnauthorizedError('Wrong Password');
    }

    // Create JWT Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    logger.info(`User logged in successfully: ${email}`);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  static async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User session is invalid');
    }
    return user;
  }
}

module.exports = AuthService;
