// Winston Logger Configuration
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
const logsDir = path.resolve(__dirname, '../logs');

// Only attempt to create logs directory if not in a serverless environment
if (!isServerless && !fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.warn('Failed to create logs directory:', err.message);
  }
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [];

if (isServerless) {
  // Console-only logging on serverless platforms
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // File + Console logging locally
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  );
  
  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'employee-service' },
  transports: transports
});

module.exports = logger;
