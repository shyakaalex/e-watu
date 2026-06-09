import { Module } from '@nestjs/common';
import { ContractExpiryJob } from './contract-expiry.job';
import { PayrollReminderJob } from './payroll-reminder.job';
import { SecondmentExpiryJob } from './secondment-expiry.job';

@Module({
  providers: [ContractExpiryJob, PayrollReminderJob, SecondmentExpiryJob],
})
export class JobsModule {}
