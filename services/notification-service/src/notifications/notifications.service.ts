import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService, type EmailTemplate } from '../email/email.service';

export type DispatchDto = {
  channel: 'email' | 'in_app' | 'both';
  to?: string;
  userId?: string;
  tenantId?: string;
  title?: string;
  body?: string;
  template?: EmailTemplate;
  payload?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  dispatch(dto: DispatchDto) {
    setImmediate(() => {
      void this.processDispatch(dto).catch((e) => {
        this.log.warn(`Async dispatch failed: ${e instanceof Error ? e.message : e}`);
      });
    });
    return { accepted: true, queued: true };
  }

  private async processDispatch(dto: DispatchDto) {
    if ((dto.channel === 'email' || dto.channel === 'both') && dto.to && dto.template) {
      await this.email.send(dto.to, dto.template, dto.payload ?? {});
    }

    if (
      (dto.channel === 'in_app' || dto.channel === 'both') &&
      dto.userId &&
      dto.title &&
      dto.body
    ) {
      await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          tenantId: dto.tenantId ?? null,
          title: dto.title,
          body: dto.body,
          channel: 'in_app',
        },
      });
    }
  }

  listForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }
}
