const Joi = require('joi');

const createTeamSchema = Joi.object({
  team_name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Team name must be at least 3 characters long',
    'any.required': 'Team name is required'
  }),
  description: Joi.string().max(500).allow('').optional(),
  team_lead_id: Joi.number().integer().allow(null).optional(),
  deadline: Joi.date().allow(null).optional()
});

const updateTeamSchema = Joi.object({
  team_name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  team_lead_id: Joi.number().integer().allow(null).optional(),
  deadline: Joi.date().allow(null).optional(),
  status: Joi.string().valid('ACTIVE', 'COMPLETED', 'ON_HOLD').required()
});

const addMemberSchema = Joi.object({
  user_id: Joi.number().integer().required().messages({
    'number.base': 'User ID must be a valid number',
    'any.required': 'User ID is required'
  }),
  team_role: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Team role must be at least 2 characters',
    'any.required': 'Team role is required'
  })
});

const teamJobSchema = Joi.object({
  job_title: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Job title must be at least 3 characters',
    'any.required': 'Job title is required'
  }),
  description: Joi.string().max(1000).allow('').optional(),
  assigned_to: Joi.number().integer().allow(null).optional(),
  deadline: Joi.date().required().messages({
    'date.base': 'Deadline must be a valid date',
    'any.required': 'Deadline is required'
  }),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional()
});

const validateCreateTeam = (req, res, next) => {
  const { error, value } = createTeamSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateUpdateTeam = (req, res, next) => {
  const { error, value } = updateTeamSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateAddMember = (req, res, next) => {
  const { error, value } = addMemberSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateTeamJob = (req, res, next) => {
  const { error, value } = teamJobSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateCreateTeam,
  validateUpdateTeam,
  validateAddMember,
  validateTeamJob
};
