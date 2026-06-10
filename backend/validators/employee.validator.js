// Employee Validation Schemas (Joi)
const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  // Optional user account credentials (if created by Admin)
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email address format'
  }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Password must be at least 6 characters long'
  }),
  role: Joi.string().valid('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE').optional(),
  reporting_manager_id: Joi.number().integer().allow(null).optional(),

  // Mandatory profile details
  department_id: Joi.number().integer().required().messages({
    'number.base': 'Department ID must be a number',
    'any.required': 'Department is required'
  }),
  phone: Joi.string().pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/).required().messages({
    'string.pattern.base': 'Phone number format is invalid',
    'any.required': 'Phone number is required'
  }),
  address: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Address must be at least 5 characters long',
    'any.required': 'Address is required'
  }),
  designation: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Designation must be at least 2 characters long',
    'any.required': 'Designation is required'
  }),
  salary: Joi.number().positive().required().messages({
    'number.positive': 'Salary must be a positive number',
    'any.required': 'Salary is required'
  }),
  skills: Joi.array().items(Joi.number().integer()).optional()
});

const updateEmployeeSchema = Joi.object({
  department_id: Joi.number().integer().required().messages({
    'number.base': 'Department ID must be a number',
    'any.required': 'Department is required'
  }),
  phone: Joi.string().pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/).required().messages({
    'string.pattern.base': 'Phone number format is invalid',
    'any.required': 'Phone number is required'
  }),
  address: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Address must be at least 5 characters long',
    'any.required': 'Address is required'
  }),
  designation: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Designation must be at least 2 characters long',
    'any.required': 'Designation is required'
  }),
  salary: Joi.number().positive().required().messages({
    'number.positive': 'Salary must be a positive number',
    'any.required': 'Salary is required'
  }),
  skills: Joi.array().items(Joi.number().integer()).optional(),
  role: Joi.string().valid('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE').optional(),
  reporting_manager_id: Joi.number().integer().allow(null).optional()
});

const validateCreateEmployee = (req, res, next) => {
  const { error, value } = createEmployeeSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateUpdateEmployee = (req, res, next) => {
  const { error, value } = updateEmployeeSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateCreateEmployee,
  validateUpdateEmployee
};
