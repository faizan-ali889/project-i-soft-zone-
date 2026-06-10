// Skill Router Controller
const SkillService = require('../services/skillService');

class SkillController {
  static async getAllSkills(req, res, next) {
    try {
      const skills = await SkillService.getAllSkills();
      res.status(200).json(skills);
    } catch (error) {
      next(error);
    }
  }

  static async createSkill(req, res, next) {
    try {
      const newSkill = await SkillService.createSkill(req.validatedData);
      res.status(201).json(newSkill);
    } catch (error) {
      next(error);
    }
  }

  static async updateSkill(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await SkillService.updateSkill(id, req.validatedData);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSkill(req, res, next) {
    try {
      const { id } = req.params;
      await SkillService.deleteSkill(id);
      res.status(200).json({ message: 'Skill deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SkillController;
