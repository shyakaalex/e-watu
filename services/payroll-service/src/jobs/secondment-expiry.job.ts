import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { dispatchNotification } from '../common/notification.dispatch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecondmentExpiryJob {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 7 * * *')
  async handleSecondmentContractExpiry() {
    const now = new Date();
    const contracts = await this.prisma.secondmentContract.findMany({
      where: { status: 'ACTIVE', endDate: { not: null } },
      include: {
        assignment: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    for (const contract of contracts) {
      if (!contract.endDate) continue;
      const daysRemaining = Math.floor(
        (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysRemaining < 0) {
        await this.prisma.secondmentContract.update({
          where: { id: contract.id },
          data: { status: 'EXPIRED' },
        });
        continue;
      }

      const payload = {
        assignmentId: contract.assignmentId,
        employeeId: contract.assignment.employeeId,
        clientName: contract.clientName,
        roleName: contract.role,
        endDate: contract.endDate,
        daysRemaining,
        tenantId: contract.tenantId,
      };

      if (daysRemaining <= 90 && !contract.alert90Sent) {
        void dispatchNotification('secondment-contract-expiring', { ...payload, alertTier: 90 });
        await this.prisma.secondmentContract.update({
          where: { id: contract.id },
          data: { alert90Sent: true },
        });
      }
      if (daysRemaining <= 60 && !contract.alert60Sent) {
        void dispatchNotification('secondment-contract-expiring', { ...payload, alertTier: 60 });
        await this.prisma.secondmentContract.update({
          where: { id: contract.id },
          data: { alert60Sent: true },
        });
      }
      if (daysRemaining <= 30 && !contract.alert30Sent) {
        void dispatchNotification('secondment-contract-expiring', { ...payload, alertTier: 30 });
        await this.prisma.secondmentContract.update({
          where: { id: contract.id },
          data: { alert30Sent: true },
        });
      }
    }
  }
}
