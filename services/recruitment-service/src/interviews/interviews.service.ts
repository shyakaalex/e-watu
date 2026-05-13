import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInterviewDto } from './dtos/create-interview.dto';
import type { UpdateInterviewDto } from './dtos/update-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, applicationId?: string) {
    return this.prisma.interview.findMany({
      where: {
        tenantId,
        ...(applicationId ? { applicationId } : {}),
      },
      include: {
        application: { include: { candidate: true, job: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: { application: { include: { candidate: true, job: true } } },
    });
    if (!interview || interview.tenantId !== tenantId) {
      throw new NotFoundException('Interview not found');
    }
    return interview;
  }

  async create(tenantId: string, dto: CreateInterviewDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });
    if (!application || application.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }
    return this.prisma.interview.create({
      data: {
        tenantId,
        applicationId: dto.applicationId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin ?? 60,
        type: dto.type ?? 'VIDEO',
        interviewerIds: dto.interviewerIds ?? [],
        status: 'SCHEDULED',
        feedback: dto.feedback ?? null,
      },
      include: { application: { include: { candidate: true, job: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInterviewDto) {
    const interview = await this.prisma.interview.findUnique({ where: { id } });
    if (!interview || interview.tenantId !== tenantId) {
      throw new NotFoundException('Interview not found');
    }
    const data: Record<string, unknown> = {};
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMin !== undefined) data.durationMin = dto.durationMin;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.interviewerIds !== undefined) data.interviewerIds = dto.interviewerIds;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.feedback !== undefined) data.feedback = dto.feedback;

    return this.prisma.interview.update({
      where: { id },
      data,
      include: { application: { include: { candidate: true, job: true } } },
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
