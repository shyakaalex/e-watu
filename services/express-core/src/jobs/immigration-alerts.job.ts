import cron from 'node-cron';
import { scanAndAlertPermitExpiries } from '../modules/immigration/immigration.service';

/**
 * Initialize background cron scheduler for checking expiring permits
 */
export function initImmigrationAlertsJob() {
  console.log('[Immigration Scheduler] Scheduling permit expiry checker to run daily at midnight (0 0 * * *)...');

  // Trigger once a day at 00:00
  cron.schedule('0 0 * * *', async () => {
    try {
      await scanAndAlertPermitExpiries();
    } catch (error) {
      console.error('[Immigration Scheduler Error] Expiry scan execution failed:', error);
    }
  });

  // Also support running immediately on startup in dev mode for validation visibility
  if (process.env.NODE_ENV === 'development' || process.env.RUN_ALERTS_ON_STARTUP === 'true') {
    console.log('[Immigration Scheduler] Dev run triggered on startup...');
    scanAndAlertPermitExpiries().catch((err) => {
      console.error('[Immigration Scheduler Error] Dev startup run failed:', err);
    });
  }
}
