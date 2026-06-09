const Joi = require('joi');

// Leave application validation
const leaveApplicationSchema = Joi.object({
  leaveTypeId: Joi.number().integer().required().messages({
    'number.base': 'Leave type ID must be a number',
    'any.required': 'Leave type ID is required'
  }),
  fromDate: Joi.date().required().messages({
    'date.base': 'From date must be a valid date',
    'any.required': 'From date is required'
  }),
  toDate: Joi.date().required().min(Joi.ref('fromDate')).messages({
    'date.base': 'To date must be a valid date',
    'any.required': 'To date is required',
    'date.min': 'To date must be after from date'
  }),
  reason: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Reason must be at least 10 characters',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required'
  })
});

// Approval validation
const approvalSchema = Joi.object({
  remarks: Joi.string().max(500).optional()
});

// Rejection validation
const rejectionSchema = Joi.object({
  remarks: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Rejection reason must be at least 5 characters',
    'any.required': 'Rejection reason is required'
  })
});

// Validation middleware
const validateLeaveApplication = (req, res, next) => {
  const { error, value } = leaveApplicationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages, error: messages.join(', ') });
  }
  
  req.validatedData = value;
  next();
};

const validateApproval = (req, res, next) => {
  const { error, value } = approvalSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  req.validatedData = value;
  next();
};

const validateRejection = (req, res, next) => {
  const { error, value } = rejectionSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  req.validatedData = value;
  next();
};

// Asset creation validation schema
const assetSchema = Joi.object({
  assetName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Asset name must be at least 3 characters',
    'any.required': 'Asset name is required'
  }),
  assetType: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Asset type must be at least 2 characters',
    'any.required': 'Asset type is required'
  }),
  serialNumber: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Serial number must be at least 3 characters',
    'any.required': 'Serial number is required'
  })
});

// Asset allocation validation schema
const assetAllocationSchema = Joi.object({
  assetId: Joi.number().integer().required().messages({
    'number.base': 'Asset ID must be a valid number',
    'any.required': 'Asset ID is required'
  }),
  employeeId: Joi.number().integer().required().messages({
    'number.base': 'Employee ID must be a valid number',
    'any.required': 'Employee ID is required'
  }),
  remarks: Joi.string().max(500).allow('').optional()
});

// Asset return validation schema
const assetReturnSchema = Joi.object({
  allocationId: Joi.number().integer().required().messages({
    'number.base': 'Allocation ID must be a valid number',
    'any.required': 'Allocation ID is required'
  }),
  remarks: Joi.string().max(500).allow('').optional()
});

const validateAsset = (req, res, next) => {
  const { error, value } = assetSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages, error: messages.join(', ') });
  }
  req.validatedData = value;
  next();
};

const validateAssetAllocation = (req, res, next) => {
  const { error, value } = assetAllocationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages, error: messages.join(', ') });
  }
  req.validatedData = value;
  next();
};

const validateAssetReturn = (req, res, next) => {
  const { error, value } = assetReturnSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages, error: messages.join(', ') });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateLeaveApplication,
  validateApproval,
  validateRejection,
  validateAsset,
  validateAssetAllocation,
  validateAssetReturn,
  leaveApplicationSchema,
  approvalSchema,
  rejectionSchema,
  assetSchema,
  assetAllocationSchema,
  assetReturnSchema
};
