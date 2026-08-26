import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { dispatchNotification } from '../common/notification.dispatch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermitExpiryJob {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 6 * * *')
  async handlePermitExpiry() {
    const now = new Date();
    const permits = await this.prisma.permit.findMany({
      where: { status: 'APPROVED' },
      include: { employee: true },
    });

    for (const permit of permits) {
      const daysLeft = Math.floor((permit.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        await this.prisma.permit.update({ where: { id: permit.id }, data: { status: 'EXPIRED' } });
        continue;
      }

      const payload = {
        permitId: permit.id,
        employeeName: `${permit.employee.firstName} ${permit.employee.lastName}`,
        employeeEmail: permit.employee.email,
        permitType: permit.permitType,
        permitNumber: permit.permitNumber,
        expiryDate: permit.expiryDate,
        daysLeft,
        tenantId: permit.tenantId,
      };

      if (daysLeft <= 90 && !permit.alert90Sent) {
        void dispatchNotification('permit-expiring', { ...payload, alertTier: 90 });
        await this.prisma.permit.update({ where: { id: permit.id }, data: { alert90Sent: true } });
      }
      if (daysLeft <= 60 && !permit.alert60Sent) {
        void dispatchNotification('permit-expiring', { ...payload, alertTier: 60 });
        await this.prisma.permit.update({ where: { id: permit.id }, data: { alert60Sent: true } });
      }
      if (daysLeft <= 30 && !permit.alert30Sent) {
        void dispatchNotification('permit-expiring', { ...payload, alertTier: 30 });
        await this.prisma.permit.update({ where: { id: permit.id }, data: { alert30Sent: true } });
      }
      if (daysLeft <= 7 && !permit.alert7Sent) {
        void dispatchNotification('permit-expiring', { ...payload, alertTier: 7 });
        await this.prisma.permit.update({ where: { id: permit.id }, data: { alert7Sent: true } });
      }
    }
  }
}
