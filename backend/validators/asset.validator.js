// Asset Validation Layer (Joi)
const Joi = require('joi');

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
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateAssetAllocation = (req, res, next) => {
  const { error, value } = assetAllocationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateAssetReturn = (req, res, next) => {
  const { error, value } = assetReturnSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateAsset,
  validateAssetAllocation,
  validateAssetReturn
};
