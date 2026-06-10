// Employee Router Controller
const EmployeeService = require('../services/employeeService');

class EmployeeController {
  static async createEmployee(req, res, next) {
    try {
      // req.user contains the admin who is creating the profile
      const profile = await EmployeeService.createEmployee(req.validatedData, req.user);
      res.status(201).json({
        message: 'Employee created successfully',
        employee: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllEmployees(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        departmentId: req.query.departmentId,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };
      
      const result = await EmployeeService.getAllEmployees(filters);
      res.status(200).json(result.employees); // Maintain same output format as previous backend
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await EmployeeService.getEmployeeById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await EmployeeService.updateEmployee(id, req.validatedData, req.user);
      res.status(200).json({
        message: 'Employee updated successfully',
        employee: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      await EmployeeService.deleteEmployee(id, req.user);
      res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async uploadImages(req, res, next) {
    try {
      const { id } = req.params;
      const images = await EmployeeService.uploadImages(id, req.files);
      res.status(201).json({
        message: 'Images uploaded successfully',
        images
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EmployeeController;
