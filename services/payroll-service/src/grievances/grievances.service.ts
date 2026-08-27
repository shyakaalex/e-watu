import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrievancesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
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

  async updateCase(
    tenantId: string,
    id: string,
    callerName: string,
    body: { status?: string; resolutionNotes?: string },
  ) {
    const existing = await this.prisma.grievanceCase.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Grievance case not found');

    const closing = body.status === 'RESOLVED' || body.status === 'DISMISSED';
    return this.prisma.grievanceCase.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status as any } : {}),
        ...(body.resolutionNotes !== undefined ? { resolutionNotes: body.resolutionNotes } : {}),
        handledByName: callerName,
        resolvedAt: closing ? new Date() : existing.resolvedAt,
      },
    });
  }
}
