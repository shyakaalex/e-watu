import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { dispatchNotification } from '../common/notification.dispatch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractExpiryJob {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 6 * * *')
  async handleContractExpiry() {
    const now = new Date();
    const contracts = await this.prisma.employeeContract.findMany({
      where: { status: 'ACTIVE', endDate: { not: null } },
      include: { employee: true },
    });

    for (const contract of contracts) {
      if (!contract.endDate) continue;
      const daysLeft = Math.floor((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        await this.prisma.employeeContract.update({ where: { id: contract.id }, data: { status: 'EXPIRED' } });
        continue;
      }

      const payload = {
        contractId: contract.id,
        employeeName: `${contract.employee.firstName} ${contract.employee.lastName}`,
        endDate: contract.endDate,
        daysLeft,
        tenantId: contract.tenantId,
      };

      if (daysLeft <= 90 && !contract.expiryAlert90Sent) {
        void dispatchNotification('contract-expiry-90', payload);
        await this.prisma.employeeContract.update({ where: { id: contract.id }, data: { expiryAlert90Sent: true } });
      }
      if (daysLeft <= 60 && !contract.expiryAlert60Sent) {
        void dispatchNotification('contract-expiry-60', payload);
        await this.prisma.employeeContract.update({ where: { id: contract.id }, data: { expiryAlert60Sent: true } });
      }
      if (daysLeft <= 30 && !contract.expiryAlert30Sent) {
        void dispatchNotification('contract-expiry-30', payload);
        await this.prisma.employeeContract.update({ where: { id: contract.id }, data: { expiryAlert30Sent: true } });
      }
    }
  }
}
