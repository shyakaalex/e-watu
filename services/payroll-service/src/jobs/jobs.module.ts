import { Module } from '@nestjs/common';
import { ContractExpiryJob } from './contract-expiry.job';
import { PayrollReminderJob } from './payroll-reminder.job';

@Module({
  providers: [ContractExpiryJob, PayrollReminderJob],
})
export class JobsModule {}
