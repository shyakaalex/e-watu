import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { dispatchNotification } from '../common/notification.dispatch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollReminderJob {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 8 20 * *')
  async handlePayrollReminder() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const configs = await this.prisma.payrollConfiguration.findMany();

    for (const config of configs) {
      const existing = await this.prisma.payrollPeriod.findFirst({
        where: {
          tenantId: config.tenantId,
          clientId: config.clientId,
          periodMonth: month,
          periodYear: year,
        },
      });

      if (!existing || existing.status === 'DRAFT') {
        void dispatchNotification('payroll-reminder', {
          tenantId: config.tenantId,
          clientId: config.clientId,
          month,
          year,
        });
      }
    }
  }
}
