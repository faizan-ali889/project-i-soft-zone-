// Skill Routes
const express = require('express');
const router = express.Router();
const SkillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSkill } = require('../validators/skill.validator');

// GET all skills
router.get('/', SkillController.getAllSkills);

// POST create skill (Admin only, auth + validate)
router.post('/', authMiddleware, validateSkill, SkillController.createSkill);

// PUT update skill (Admin only, auth + validate)
router.put('/:id', authMiddleware, validateSkill, SkillController.updateSkill);

// DELETE skill (Admin only)
router.delete('/:id', authMiddleware, SkillController.deleteSkill);

module.exports = router;