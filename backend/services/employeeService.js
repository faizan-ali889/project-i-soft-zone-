// Employee Business Logic Service
const EmployeeRepository = require('../repositories/employeeRepository');
const UserRepository = require('../repositories/userRepository');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const EmailService = require('./emailService');

class EmployeeService {
  static async createEmployee(employeeData, performedByUser) {
    const { 
      name, email, password, role, reporting_manager_id,
      department_id, phone, address, designation, salary, skills 
    } = employeeData;

    let targetUserId;

    // Check if new user details are provided (Admin registering a new user & profile together)
    if (name && email && password) {
      const emailLower = email.toLowerCase();
      
      // Check if user already exists
      const userExists = await UserRepository.findByEmail(emailLower);
      if (userExists) {
        throw new ConflictError('A user already exists with this email address.');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user record
      const newUser = await UserRepository.createUser(
        name, 
        emailLower, 
        hashedPassword, 
        role || 'EMPLOYEE', 
        reporting_manager_id
      );
      targetUserId = newUser.id;
      logger.info(`Admin created new user account: ${emailLower} during profile creation`);
      
      // Send welcome email asynchronously
      EmailService.sendWelcomeEmail(emailLower, name, password);
    } else {
      // Fallback: If no user credentials are provided, associate with the logged-in user
      targetUserId = performedByUser.id;
    }

    // Check if employee profile already exists for this target user
    const profileExists = await EmployeeRepository.verifyProfileExists(targetUserId);
    if (profileExists) {
      throw new ConflictError('An employee profile already exists for this user.');
    }

    // Create employee profile
    const profile = await EmployeeRepository.createProfile(
      targetUserId,
      department_id,
      phone,
      address,
      designation,
      salary
    );

    // Link skills
    if (skills && skills.length > 0) {
      await EmployeeRepository.linkSkills(profile.id, skills);
    }

    logger.info(`Employee profile successfully created (ID: ${profile.id}, UserID: ${targetUserId})`);
    return profile;
  }

  static async getAllEmployees(filters) {
    return await EmployeeRepository.getAllEmployees(filters);
  }

  static async getEmployeeById(id) {
    const employee = await EmployeeRepository.getById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const skills = await EmployeeRepository.getSkills(id);
    const images = await EmployeeRepository.getImages(id);

    return { employee, skills, images };
  }

  static async updateEmployee(id, employeeData, performedByUser) {
    const { 
      department_id, phone, address, designation, salary, skills, 
      role, reporting_manager_id 
    } = employeeData;

    // Verify employee profile exists
    const existingProfile = await EmployeeRepository.getById(id);
    if (!existingProfile) {
      throw new NotFoundError('Employee not found');
    }

    // Update profile
    const profile = await EmployeeRepository.updateProfile(id, department_id, phone, address, designation, salary);

    // Update user role and manager if requested (Admin only)
    if (performedByUser.role === 'ADMIN' && (role !== undefined || reporting_manager_id !== undefined)) {
      const updateData = {};
      if (role) updateData.role = role;
      if (reporting_manager_id !== undefined) updateData.reporting_manager_id = reporting_manager_id;
      
      await UserRepository.updateUser(existingProfile.user_id, updateData);
    }

    // Update skills
    await EmployeeRepository.clearSkills(id);
    if (skills && skills.length > 0) {
      await EmployeeRepository.linkSkills(id, skills);
    }

    logger.info(`Employee profile updated: ${id} by ${performedByUser.email}`);
    return profile;
  }

  static async deleteEmployee(id, performedByUser) {
    // Verify employee profile exists
    const existingProfile = await EmployeeRepository.getById(id);
    if (!existingProfile) {
      throw new NotFoundError('Employee not found');
    }

    // Delete profile (cascades or drops dependent skills/images/notifications depending on SQL config, we clean up repository-wise)
    await EmployeeRepository.clearSkills(id);
    const deleted = await EmployeeRepository.deleteProfile(id);

    // Delete user from users table (Admin registration clean up)
    await db.query('DELETE FROM users WHERE id = $1', [existingProfile.user_id]);

    logger.info(`Employee deleted successfully: ID ${id} (UserID ${existingProfile.user_id}) by ${performedByUser.email}`);
    return deleted;
  }

  static async uploadImages(id, files) {
    if (!files || files.length === 0) {
      throw new ValidationError('No files provided for upload');
    }

    // Verify employee profile exists
    const existingProfile = await EmployeeRepository.getById(id);
    if (!existingProfile) {
      throw new NotFoundError('Employee not found');
    }

    const uploadedImages = [];
    for (const file of files) {
      // Normalize paths to forward slashes for storage and API responses
      const normalizedPath = `/uploads/employees/${file.filename}`;
      const img = await EmployeeRepository.insertImage(id, normalizedPath);
      uploadedImages.push(img);
    }

    logger.info(`Uploaded ${files.length} images for Employee ID ${id}`);
    return uploadedImages;
  }
}

module.exports = EmployeeService;
