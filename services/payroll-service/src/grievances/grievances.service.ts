import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SENIOR_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'MANAGING_DIRECTOR'];

/** Categories a line manager never sees or handles, regardless of team leadership — always
 *  HR-only, since the manager may be the subject of the complaint. */
const SENSITIVE_CATEGORIES = ['HARASSMENT', 'DISCRIMINATION'];

@Injectable()
export class GrievancesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  /** Team ids where this employee holds the LEAD role — same convention as the leave module. */
  private async getLedTeamIds(tenantId: string, employeeId: string): Promise<string[]> {
    const led = await this.prisma.teamMember.findMany({
      where: { tenantId, employeeId, role: 'LEAD' },
      select: { teamId: true },
    });
    return led.map((l) => l.teamId);
  }

  private async getTeamsMemberEmployeeIds(tenantId: string, teamIds: string[]): Promise<string[]> {
    if (!teamIds.length) return [];
    const members = await this.prisma.teamMember.findMany({
      where: { tenantId, teamId: { in: teamIds } },
      select: { employeeId: true },
    });
    return [...new Set(members.map((m) => m.employeeId))];
  }

  async createGrievance(
    tenantId: string,
    callerEmail: string | undefined,
    body: { category: string; description: string },
  ) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) throw new ForbiddenException('No linked employee record');
    return this.prisma.grievanceCase.create({
      data: {
        tenantId,
        raisedByEmployeeId: me.id,
        category: body.category as any,
        description: body.description,
      },
    });
  }

  async listMyGrievances(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) return [];
    return this.prisma.grievanceCase.findMany({
      where: { tenantId, raisedByEmployeeId: me.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(tenantId: string, status?: string) {
    return this.prisma.grievanceCase.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: { raisedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Non-sensitive grievances raised by anyone on a team this caller leads. Empty for anyone
   *  who isn't a team lead — same "empty rather than an error" convention as leave/KPIs.
   *  Harassment/Discrimination never appear here, even for a lead — HR-only regardless. */
  async listForLineManager(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) return [];
    const ledTeamIds = await this.getLedTeamIds(tenantId, me.id);
    const memberIds = (await this.getTeamsMemberEmployeeIds(tenantId, ledTeamIds)).filter(
      (id) => id !== me.id,
    );
    if (memberIds.length === 0) return [];

    return this.prisma.grievanceCase.findMany({
      where: {
        tenantId,
        raisedByEmployeeId: { in: memberIds },
        category: { notIn: SENSITIVE_CATEGORIES as any },
      },
      include: { raisedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** HR/Admin/MD may act on anything. Otherwise: never for a sensitive category, and only for
   *  a case raised by someone on a team the caller leads. */
  private async assertCanActOnCase(
    tenantId: string,
    existing: { category: string; raisedByEmployeeId: string },
    caller: { email?: string; roles: string[] },
  ): Promise<void> {
    if (SENIOR_ROLES.some((r) => caller.roles.includes(r))) return;
    if (SENSITIVE_CATEGORIES.includes(existing.category)) {
      throw new ForbiddenException('This category can only be handled by HR');
    }

    const me = await this.resolveCallerEmployee(tenantId, caller.email);
    if (me) {
      const ledTeamIds = await this.getLedTeamIds(tenantId, me.id);
      const memberIds = await this.getTeamsMemberEmployeeIds(tenantId, ledTeamIds);
      if (memberIds.includes(existing.raisedByEmployeeId)) return;
    }

    throw new ForbiddenException('You are not authorized to act on this grievance');
  }

  async updateCase(
    tenantId: string,
    id: string,
    caller: { email?: string; roles: string[]; displayName: string },
    body: { status?: string; resolutionNotes?: string },
  ) {
    const existing = await this.prisma.grievanceCase.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Grievance case not found');
    await this.assertCanActOnCase(tenantId, existing, caller);

    const closing = body.status === 'RESOLVED' || body.status === 'DISMISSED';
    return this.prisma.grievanceCase.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status as any } : {}),
        ...(body.resolutionNotes !== undefined ? { resolutionNotes: body.resolutionNotes } : {}),
        handledByName: caller.displayName,
        resolvedAt: closing ? new Date() : existing.resolvedAt,
      },
    });
  }
}
