// Skill Joi Validator
const Joi = require('joi');

const skillSchema = Joi.object({
  skill_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Skill name must be at least 2 characters long',
    'any.required': 'Skill name is required'
  })
});

const validateSkill = (req, res, next) => {
  const { error, value } = skillSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateSkill
};
