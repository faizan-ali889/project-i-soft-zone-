// Department Service with Cache Layer
const DepartmentRepository = require('../repositories/departmentRepository');
const cache = require('../config/cache');
const { ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class DepartmentService {
  static async getAllDepartments() {
    const cacheKey = 'departments_list';
    
    // Check cache first
    const cachedDepts = cache.get(cacheKey);
    if (cachedDepts) {
      logger.info('Departments retrieved from Cache');
      return cachedDepts;
    }

    // Fetch from Repository
    const departments = await DepartmentRepository.getAll();
    
    // Save to Cache
    cache.set(cacheKey, departments);
    logger.info('Departments retrieved from Database and cached');
    
    return departments;
  }

  static async createDepartment(departmentData) {
    const { department_name } = departmentData;

    // Check if duplicate name exists
    const duplicate = await DepartmentRepository.findByName(department_name);
    if (duplicate) {
      throw new ConflictError('A department with this name already exists');
    }

    const newDept = await DepartmentRepository.create(department_name);

    // Invalidate cache
    cache.del('departments_list');
    logger.info(`Department created: ${department_name}, cache cleared`);

    return newDept;
  }

  static async updateDepartment(id, departmentData) {
    const { department_name } = departmentData;

    const existing = await DepartmentRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    const updated = await DepartmentRepository.update(id, department_name);

    // Invalidate cache
    cache.del('departments_list');
    logger.info(`Department updated (ID: ${id}) to ${department_name}, cache cleared`);

    return updated;
  }

  static async deleteDepartment(id) {
    const existing = await DepartmentRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    const deleted = await DepartmentRepository.delete(id);

    // Invalidate cache
    cache.del('departments_list');
    logger.info(`Department deleted (ID: ${id}), cache cleared`);

    return deleted;
  }
}

module.exports = DepartmentService;
