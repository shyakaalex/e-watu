import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // support root level env

import app from './app';
import { initImmigrationAlertsJob } from './jobs/immigration-alerts.job';

const PORT = process.env.PORT || 3022;

app.listen(PORT, () => {
  console.log(`[E-Watu Express Core] Server is running on port ${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/health`);
  
  // Start immigration expiry background engine schedule
  initImmigrationAlertsJob();
});
