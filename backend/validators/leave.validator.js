// Leave Validation Layer (Joi)
const Joi = require('joi');

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

const approvalSchema = Joi.object({
  remarks: Joi.string().max(500).allow('').optional()
});

const rejectionSchema = Joi.object({
  remarks: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Rejection reason must be at least 5 characters',
    'any.required': 'Rejection reason is required'
  })
});

const validateLeaveApplication = (req, res, next) => {
  const { error, value } = leaveApplicationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateApproval = (req, res, next) => {
  const { error, value } = approvalSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

const validateRejection = (req, res, next) => {
  const { error, value } = rejectionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateLeaveApplication,
  validateApproval,
  validateRejection
};
