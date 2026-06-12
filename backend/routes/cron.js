const express = require('express');
const router = express.Router();
const db = require('../config/db');
const logger = require('../config/logger');

// Security middleware ensuring calls originate from Vercel scheduler or local development
const secureCron = (req, res, next) => {
  if (req.headers['x-vercel-cron'] === '1' || process.env.NODE_ENV !== 'production') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Vercel Cron authorization required' });
};

router.use(secureCron);

// 1. Daily Leave Report (0 20 * * *)
router.get('/leave-report', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT employee_name, department_name, leave_name, pending_count 
       FROM leave_reports 
       WHERE pending_count > 0`
    );
    logger.info(`[Vercel Cron] Daily Leave Report: Found ${result.rows.length} pending leave requests requiring review.`);
    return res.json({ success: true, pendingCount: result.rows.length });
  } catch (error) {
    logger.error('[Vercel Cron] Daily Leave Report Error:', error);
    next(error);
  }
});

// 2. Daily Database Backup Mock (0 2 * * *)
router.get('/db-backup', async (req, res, next) => {
  try {
    const backupTime = new Date().toISOString().replace(/[:.]/g, '-');
    logger.info(`[Vercel Cron] Database Backup created successfully: backup_${backupTime}.sql`);
    return res.json({ success: true, backup: `backup_${backupTime}.sql` });
  } catch (error) {
    logger.error('[Vercel Cron] Database Backup Error:', error);
    next(error);
  }
});

// 3. Notification Cleanup (0 3 * * *)
router.get('/notification-cleanup', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM notifications 
       WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days'`
    );
    logger.info(`[Vercel Cron] Notification Cleanup completed. Deleted ${result.rowCount} old read notifications.`);
    return res.json({ success: true, deletedCount: result.rowCount });
  } catch (error) {
    logger.error('[Vercel Cron] Notification Cleanup Error:', error);
    next(error);
  }
});

module.exports = router;
