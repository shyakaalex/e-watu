import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EwatuRole } from '@ewatu/common-auth';
import { PrismaService } from '../prisma/prisma.service';

const SENIOR_ROLES = [EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR] as const;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  /** Every employee who belongs to a team this employee leads, de-duplicated. */
  private async getLedTeamMemberEmployeeIds(tenantId: string, employeeId: string): Promise<string[]> {
    const led = await this.prisma.teamMember.findMany({
      where: { tenantId, employeeId, role: 'LEAD' },
      select: { teamId: true },
    });
    const teamIds = led.map((l) => l.teamId);
    if (!teamIds.length) return [];
    const members = await this.prisma.teamMember.findMany({
      where: { tenantId, teamId: { in: teamIds } },
      select: { employeeId: true },
    });
    return [...new Set(members.map((m) => m.employeeId))];
  }

  /** Senior officers may assign to anyone; a team lead to their own team's members; anyone to
   *  themselves (a personal to-do). */
  private async assertCanAssign(
    tenantId: string,
    targetEmployeeId: string,
    caller: { email?: string; roles: string[] },
  ): Promise<void> {
    if (SENIOR_ROLES.some((r) => caller.roles.includes(r))) return;

    const me = await this.resolveCallerEmployee(tenantId, caller.email);
    if (me?.id === targetEmployeeId) return;

    if (me) {
      const ledMembers = await this.getLedTeamMemberEmployeeIds(tenantId, me.id);
      if (ledMembers.includes(targetEmployeeId)) return;
    }

    throw new ForbiddenException('You can only assign a task to yourself or someone on a team you lead');
  }

  async listMyTasks(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) return [];
    return this.prisma.task.findMany({
      where: { tenantId, employeeId: me.id },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  /** Tasks assigned to people on a team the caller leads (senior officers see everyone's). */
  async listAssignedByMe(tenantId: string, caller: { email?: string; roles: string[] }) {
    const isSenior = SENIOR_ROLES.some((r) => caller.roles.includes(r));
    let employeeIds: string[] | undefined;

    if (!isSenior) {
      const me = await this.resolveCallerEmployee(tenantId, caller.email);
      if (!me) return [];
      employeeIds = await this.getLedTeamMemberEmployeeIds(tenantId, me.id);
      if (!employeeIds.length) return [];
    }

    return this.prisma.task.findMany({
      where: { tenantId, ...(employeeIds ? { employeeId: { in: employeeIds } } : {}) },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(
    tenantId: string,
    caller: { email?: string; roles: string[]; name: string },
    body: { employeeId: string; title: string; description?: string; dueDate?: string },
  ) {
    await this.assertCanAssign(tenantId, body.employeeId, caller);
    return this.prisma.task.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        assignedByName: caller.name,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
    });
  }

  /** Only the assignee can move their own task between statuses. */
  async updateTaskStatus(
    tenantId: string,
    id: string,
    callerEmail: string | undefined,
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE',
  ) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.tenantId !== tenantId) throw new NotFoundException('Task not found');

    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me || me.id !== task.employeeId) {
      throw new ForbiddenException("Only the assignee can update this task's status");
    }

    return this.prisma.task.update({
      where: { id },
      data: { status, completedAt: status === 'DONE' ? new Date() : null },
    });
  }

  async deleteTask(tenantId: string, id: string, caller: { email?: string; roles: string[] }) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.tenantId !== tenantId) throw new NotFoundException('Task not found');
    await this.assertCanAssign(tenantId, task.employeeId, caller);
    return this.prisma.task.delete({ where: { id } });
  }
}
