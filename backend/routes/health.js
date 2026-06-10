// Health Check and System Monitoring Router
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const stats = require('../utils/stats');

router.get('/', async (req, res) => {
  const healthInfo = {
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    stats: {
      totalRequests: stats.totalRequests,
      failedLogins: stats.failedLogins,
      apiCalls: stats.apiCalls
    }
  };

  try {
    // Check database connectivity
    const dbCheck = await db.query('SELECT NOW()');
    healthInfo.database = {
      status: 'CONNECTED',
      time: dbCheck.rows[0].now
    };

    // Get total users count from DB
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    healthInfo.stats.totalUsers = parseInt(usersCount.rows[0].count);

  } catch (error) {
    healthInfo.status = 'DOWN';
    healthInfo.database = {
      status: 'DISCONNECTED',
      error: error.message
    };
  }

  const statusCode = healthInfo.status === 'UP' ? 200 : 500;
  res.status(statusCode).json(healthInfo);
});

// GET Logs (Admin only)
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

router.get('/logs', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const logType = req.query.type === 'error' ? 'error.log' : 'combined.log';
    const logPath = path.resolve(__dirname, `../logs/${logType}`);

    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [] });
    }

    const fileContent = fs.readFileSync(logPath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(Boolean);
    const lastLines = lines.slice(-100).reverse(); // latest first

    res.json({ logs: lastLines });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
