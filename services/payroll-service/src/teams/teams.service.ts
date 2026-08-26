import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly memberInclude = {
    members: {
      include: { employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, email: true } } },
      orderBy: { role: 'asc' as const },
    },
  };

  async listTeams(tenantId: string) {
    return this.prisma.team.findMany({
      where: { tenantId },
      include: this.memberInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTeam(tenantId: string, id: string) {
    const team = await this.prisma.team.findUnique({ where: { id }, include: this.memberInclude });
    if (!team || team.tenantId !== tenantId) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async createTeam(tenantId: string, body: { name: string; parentTeamId?: string }) {
    if (body.parentTeamId) {
      await this.getTeam(tenantId, body.parentTeamId);
    }
    return this.prisma.team.create({
      data: { tenantId, name: body.name, parentTeamId: body.parentTeamId },
      include: this.memberInclude,
    });
  }

  async updateTeam(tenantId: string, id: string, body: { name?: string; parentTeamId?: string | null }) {
    await this.getTeam(tenantId, id);
    if (body.parentTeamId) {
      if (body.parentTeamId === id) {
        throw new BadRequestException('A team cannot be its own parent');
      }
      await this.getTeam(tenantId, body.parentTeamId);
    }
    return this.prisma.team.update({
      where: { id },
      data: { name: body.name, parentTeamId: body.parentTeamId },
      include: this.memberInclude,
    });
  }

  async deleteTeam(tenantId: string, id: string) {
    await this.getTeam(tenantId, id);
    return this.prisma.team.delete({ where: { id } });
  }

  async addMember(tenantId: string, teamId: string, body: { employeeId: string; role?: 'LEAD' | 'CORE' | 'MEMBER' }) {
    await this.getTeam(tenantId, teamId);
    const employee = await this.prisma.employee.findFirst({ where: { id: body.employeeId, tenantId } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    const existing = await this.prisma.teamMember.findUnique({
      where: { teamId_employeeId: { teamId, employeeId: body.employeeId } },
    });
    if (existing) {
      throw new ConflictException('This employee is already a member of this team');
    }
    return this.prisma.teamMember.create({
      data: { tenantId, teamId, employeeId: body.employeeId, role: body.role ?? 'MEMBER' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } } },
    });
  }

  async updateMember(tenantId: string, teamId: string, employeeId: string, body: { role: 'LEAD' | 'CORE' | 'MEMBER' }) {
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_employeeId: { teamId, employeeId } } });
    if (!member || member.tenantId !== tenantId) {
      throw new NotFoundException('Team member not found');
    }
    return this.prisma.teamMember.update({
      where: { teamId_employeeId: { teamId, employeeId } },
      data: { role: body.role },
    });
  }

  async removeMember(tenantId: string, teamId: string, employeeId: string) {
    const member = await this.prisma.teamMember.findUnique({ where: { teamId_employeeId: { teamId, employeeId } } });
    if (!member || member.tenantId !== tenantId) {
      throw new NotFoundException('Team member not found');
    }
    return this.prisma.teamMember.delete({ where: { teamId_employeeId: { teamId, employeeId } } });
  }

  /** Teams the caller (resolved via their own linked Employee record) belongs to, with their
   *  role in each — used to build the "which team am I leading" picker for Team KPIs. */
  async listMyTeams(tenantId: string, callerEmail: string) {
    const me = await this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: callerEmail, mode: 'insensitive' } },
    });
    if (!me) return [];
    const memberships = await this.prisma.teamMember.findMany({
      where: { tenantId, employeeId: me.id },
      include: { team: true },
    });
    return memberships.map((m) => ({ ...m.team, myRole: m.role }));
  }
}
