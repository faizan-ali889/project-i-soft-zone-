// Request Logging Middleware using Winston
const logger = require('../config/logger');
const stats = require('../utils/stats');

module.exports = (req, res, next) => {
  const start = Date.now();
  
  // Track statistics
  stats.totalRequests++;
  const cleanPath = req.originalUrl.split('?')[0];
  stats.apiCalls[cleanPath] = (stats.apiCalls[cleanPath] || 0) + 1;
  
  // Hook into res.end to log response details
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 500) {
      logger.error(`API Error Response: ${req.method} ${req.originalUrl}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`API Client Error Response: ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(`API Success Response: ${req.method} ${req.originalUrl}`, logData);
    }
  });

  next();
};
