import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  async listCourses(tenantId: string) {
    return this.prisma.trainingCourse.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createCourse(
    tenantId: string,
    body: { name: string; description?: string; mandatory?: boolean; dueDate?: string },
  ) {
    const course = await this.prisma.trainingCourse.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        mandatory: body.mandatory ?? true,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
    });

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, employmentStatus: 'ACTIVE' },
      select: { id: true },
    });
    if (employees.length) {
      await this.prisma.trainingRecord.createMany({
        data: employees.map((e) => ({ tenantId, courseId: course.id, employeeId: e.id })),
        skipDuplicates: true,
      });
    }
    return course;
  }

  async deleteCourse(tenantId: string, id: string) {
    const existing = await this.prisma.trainingCourse.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Training course not found');
    return this.prisma.trainingCourse.delete({ where: { id } });
  }

  async listMyRecords(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) return [];
    return this.prisma.trainingRecord.findMany({
      where: { tenantId, employeeId: me.id },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMyRecord(
    tenantId: string,
    callerEmail: string | undefined,
    recordId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
  ) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) throw new ForbiddenException('No linked employee record');
    const record = await this.prisma.trainingRecord.findFirst({
      where: { id: recordId, tenantId, employeeId: me.id },
    });
    if (!record) throw new NotFoundException('Training record not found');

    return this.prisma.trainingRecord.update({
      where: { id: recordId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
      include: { course: true },
    });
  }
}
