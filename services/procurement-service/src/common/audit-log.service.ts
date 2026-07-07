import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    tenantId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    payload: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.securityAuditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          payload: JSON.stringify(params.payload),
        },
      });
    } catch (error) {
      console.error('Failed to write security audit log:', error);
      throw error;
    }
  }
}
