// Centralized Error Handling Middleware
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log details using Winston logger
  const logMessage = `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  if (err.statusCode >= 500) {
    logger.error(logMessage, { stack: err.stack });
  } else {
    logger.warn(logMessage);
  }

  // Handle specific database errors (PostgreSQL unique constraints etc.)
  if (err.code === '23505') {
    err.statusCode = 409;
    err.status = 'fail';
    err.message = 'Duplicate key value violates unique constraint.';
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Production or Staging mode
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};
