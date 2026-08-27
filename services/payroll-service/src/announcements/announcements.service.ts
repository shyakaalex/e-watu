import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EwatuRole } from '@ewatu/common-auth';
import { PrismaService } from '../prisma/prisma.service';

const SENIOR_ROLES = [EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR] as const;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  /** Company-wide announcements (teamId null) plus anything posted to a team the caller belongs
   *  to (any membership role, not just LEAD — every teammate should see their team's notices). */
  async listForCaller(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    const myTeamIds = me
      ? (
          await this.prisma.teamMember.findMany({
            where: { tenantId, employeeId: me.id },
            select: { teamId: true },
          })
        ).map((m) => m.teamId)
      : [];

    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [{ teamId: null }, ...(myTeamIds.length ? [{ teamId: { in: myTeamIds } }] : [])],
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Senior officers may post company-wide or to any team; a team lead may post to a team they
   *  lead. No company-wide posting for a team lead without a senior role. */
  private async assertCanPost(
    tenantId: string,
    teamId: string | undefined,
    caller: { email?: string; roles: string[] },
  ): Promise<void> {
    if (SENIOR_ROLES.some((r) => caller.roles.includes(r))) return;

    if (!teamId) {
      throw new ForbiddenException('Only a senior officer can post a company-wide announcement');
    }

    const me = await this.resolveCallerEmployee(tenantId, caller.email);
    if (me) {
      const membership = await this.prisma.teamMember.findUnique({
        where: { teamId_employeeId: { teamId, employeeId: me.id } },
      });
      if (membership?.role === 'LEAD') return;
    }

    throw new ForbiddenException('Only that team\'s lead (or a senior officer) can post to it');
  }

  async createAnnouncement(
    tenantId: string,
    caller: { email?: string; roles: string[]; name: string },
    body: { title: string; body: string; teamId?: string },
  ) {
    await this.assertCanPost(tenantId, body.teamId, caller);
    return this.prisma.announcement.create({
      data: {
        tenantId,
        teamId: body.teamId,
        title: body.title,
        body: body.body,
        postedByName: caller.name,
      },
      include: { team: { select: { id: true, name: true } } },
    });
  }

  async deleteAnnouncement(tenantId: string, id: string, caller: { email?: string; roles: string[] }) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement || announcement.tenantId !== tenantId) {
      throw new NotFoundException('Announcement not found');
    }
    await this.assertCanPost(tenantId, announcement.teamId ?? undefined, caller);
    return this.prisma.announcement.delete({ where: { id } });
  }
}
