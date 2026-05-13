import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateApplicationDto } from './dtos/create-application.dto';
import type { UpdateStageDto } from './dtos/update-stage.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, filters: { jobId?: string; candidateId?: string; stage?: string }) {
    return this.prisma.application.findMany({
      where: {
        tenantId,
        ...(filters.jobId ? { jobId: filters.jobId } : {}),
        ...(filters.candidateId ? { candidateId: filters.candidateId } : {}),
        ...(filters.stage ? { stage: filters.stage } : {}),
      },
      include: { candidate: true, job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: true,
        interviews: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!app || app.tenantId !== tenantId) throw new NotFoundException('Application not found');
    return app;
  }

  async create(tenantId: string, dto: CreateApplicationDto) {
    const [job, candidate] = await Promise.all([
      this.prisma.job.findUnique({ where: { id: dto.jobId } }),
      this.prisma.candidate.findUnique({ where: { id: dto.candidateId } }),
    ]);
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');
    if (!candidate || candidate.tenantId !== tenantId) {
      throw new NotFoundException('Candidate not found');
    }
    try {
      return await this.prisma.application.create({
        data: {
          tenantId,
          jobId: dto.jobId,
          candidateId: dto.candidateId,
          stage: 'APPLIED',
          notes: dto.notes ?? null,
        },
        include: { candidate: true, job: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This candidate has already applied to this job');
      }
      throw e;
    }
  }

  async updateStage(tenantId: string, id: string, dto: UpdateStageDto) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app || app.tenantId !== tenantId) throw new NotFoundException('Application not found');
    return this.prisma.application.update({
      where: { id },
      data: { stage: dto.stage, ...(dto.notes !== undefined ? { notes: dto.notes } : {}) },
      include: { candidate: true, job: true },
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
