// Attendance Joi Validator
const Joi = require('joi');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const attendanceSettingsSchema = Joi.object({
  startTime: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM or HH:MM:SS format',
    'any.required': 'Start time is required'
  }),
  endTime: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'End time must be in HH:MM or HH:MM:SS format',
    'any.required': 'End time is required'
  })
});

const validateAttendanceSettings = (req, res, next) => {
  const { error, value } = attendanceSettingsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(422).json({ error: messages.join(', '), errors: messages });
  }
  req.validatedData = value;
  next();
};

module.exports = {
  validateAttendanceSettings
};
