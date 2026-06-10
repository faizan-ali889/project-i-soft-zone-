// Skill Service with Cache Layer
const SkillRepository = require('../repositories/skillRepository');
const cache = require('../config/cache');
const { ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class SkillService {
  static async getAllSkills() {
    const cacheKey = 'skills_list';
    
    // Check cache first
    const cachedSkills = cache.get(cacheKey);
    if (cachedSkills) {
      logger.info('Skills retrieved from Cache');
      return cachedSkills;
    }

    // Fetch from Repository
    const skills = await SkillRepository.getAll();
    
    // Save to Cache
    cache.set(cacheKey, skills);
    logger.info('Skills retrieved from Database and cached');
    
    return skills;
  }

  static async createSkill(skillData) {
    const { skill_name } = skillData;

    // Check duplicate
    const duplicate = await SkillRepository.findByName(skill_name);
    if (duplicate) {
      throw new ConflictError('A skill with this name already exists');
    }

    const newSkill = await SkillRepository.create(skill_name);

    // Invalidate cache
    cache.del('skills_list');
    logger.info(`Skill created: ${skill_name}, cache cleared`);

    return newSkill;
  }

  static async updateSkill(id, skillData) {
    const { skill_name } = skillData;

    const existing = await SkillRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('Skill not found');
    }

    const updated = await SkillRepository.update(id, skill_name);

    // Invalidate cache
    cache.del('skills_list');
    logger.info(`Skill updated (ID: ${id}) to ${skill_name}, cache cleared`);

    return updated;
  }

  static async deleteSkill(id) {
    const existing = await SkillRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('Skill not found');
    }

    const deleted = await SkillRepository.delete(id);

    // Invalidate cache
    cache.del('skills_list');
    logger.info(`Skill deleted (ID: ${id}), cache cleared`);

    return deleted;
  }
}

module.exports = SkillService;
