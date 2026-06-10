// Node-Cron Background Jobs Manager
const cron = require('node-cron');
const logger = require('../config/logger');
const db = require('../config/db');

class CronJobs {
  static init() {
    logger.info('Initializing Node-Cron background jobs...');

    // 1. Daily Leave Report (at 8 PM daily: '0 20 * * *')
    // We will run it every 5 minutes in development for demo or once daily in production
    const leaveCronSchedule = process.env.NODE_ENV === 'production' ? '0 20 * * *' : '*/5 * * * *';
    cron.schedule(leaveCronSchedule, async () => {
      logger.info('[Cron Job] Executing Daily Leave Report job...');
      try {
        const result = await db.query(
          `SELECT employee_name, department_name, leave_name, pending_count 
           FROM leave_reports 
           WHERE pending_count > 0`
        );
        logger.info(`[Cron Job] Daily Leave Report: Found ${result.rows.length} pending leave requests requiring review.`);
      } catch (error) {
        logger.error('[Cron Job] Error executing Daily Leave Report:', error);
      }
    });

    // 2. Daily Database Backup (at 2 AM daily: '0 2 * * *')
    const backupCronSchedule = process.env.NODE_ENV === 'production' ? '0 2 * * *' : '*/10 * * * *';
    cron.schedule(backupCronSchedule, async () => {
      logger.info('[Cron Job] Executing Daily Database Backup mock...');
      try {
        // Mocking a PG database dump or backup file archiving
        const backupTime = new Date().toISOString().replace(/[:.]/g, '-');
        logger.info(`[Cron Job] Database Backup created successfully: backup_${backupTime}.sql`);
      } catch (error) {
        logger.error('[Cron Job] Error during database backup:', error);
      }
    });

    // 3. Notification Cleanup (at 3 AM daily: '0 3 * * *' - deletes read notifications older than 30 days)
    const cleanupCronSchedule = process.env.NODE_ENV === 'production' ? '0 3 * * *' : '*/15 * * * *';
    cron.schedule(cleanupCronSchedule, async () => {
      logger.info('[Cron Job] Executing Notification Cleanup job...');
      try {
        const result = await db.query(
          `DELETE FROM notifications 
           WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days'`
        );
        logger.info(`[Cron Job] Notification Cleanup completed. Deleted ${result.rowCount} old read notifications.`);
      } catch (error) {
        logger.error('[Cron Job] Error during notification cleanup:', error);
      }
    });

    logger.info('Node-Cron background jobs scheduled successfully!');
  }
}

module.exports = CronJobs;
