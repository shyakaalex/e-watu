import { Module } from '@nestjs/common';
import { ContractExpiryJob } from './contract-expiry.job';
import { PayrollReminderJob } from './payroll-reminder.job';
import { SecondmentExpiryJob } from './secondment-expiry.job';
import { PermitExpiryJob } from './permit-expiry.job';

@Module({
  providers: [ContractExpiryJob, PayrollReminderJob, SecondmentExpiryJob, PermitExpiryJob],
})
export class JobsModule {}
