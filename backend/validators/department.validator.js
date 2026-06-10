// Department Joi Validator
const Joi = require('joi');

const departmentSchema = Joi.object({
  department_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Department name must be at least 2 characters long',
    'any.required': 'Department name is required'
  })
});

const validateDepartment = (req, res, next) => {
  const { error, value } = departmentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateDepartment
};
