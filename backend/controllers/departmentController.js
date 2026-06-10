// Department Router Controller
const DepartmentService = require('../services/departmentService');

class DepartmentController {
  static async getAllDepartments(req, res, next) {
    try {
      const departments = await DepartmentService.getAllDepartments();
      res.status(200).json(departments);
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req, res, next) {
    try {
      const newDept = await DepartmentService.createDepartment(req.validatedData);
      res.status(201).json(newDept);
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await DepartmentService.updateDepartment(id, req.validatedData);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      await DepartmentService.deleteDepartment(id);
      res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DepartmentController;
