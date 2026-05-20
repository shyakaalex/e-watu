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
        stageHistory: { orderBy: { createdAt: 'asc' } },
        offers: { orderBy: { createdAt: 'desc' } },
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

    // Duplicate detection: if candidate already applied, link to existing application
    const existing = await this.prisma.application.findUnique({
      where: { tenantId_jobId_candidateId: { tenantId, jobId: dto.jobId, candidateId: dto.candidateId } },
    });
    if (existing) {
      throw new ConflictException('This candidate has already applied to this job');
    }

    try {
      if (dto.source) {
        await this.prisma.candidate.update({
          where: { id: dto.candidateId },
          data: { source: dto.source },
        });
      }

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

  async updateStage(tenantId: string, id: string, dto: UpdateStageDto, changedBy: string) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app || app.tenantId !== tenantId) throw new NotFoundException('Application not found');

    const data: Prisma.ApplicationUpdateInput = {
      stage: dto.stage,
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.stage === 'REJECTED' && dto.rejectionReason
        ? { rejectionReason: dto.rejectionReason }
        : {}),
    };

    const [updated] = await this.prisma.$transaction([
      this.prisma.application.update({
        where: { id },
        data,
        include: { candidate: true, job: true },
      }),
      this.prisma.stageHistory.create({
        data: {
          tenantId,
          applicationId: id,
          fromStage: app.stage,
          toStage: dto.stage,
          changedBy,
          notes: dto.notes ?? null,
        },
      }),
    ]);

    return updated;
  }

  async bulkUpdateStage(
    tenantId: string,
    applicationIds: string[],
    stage: string,
    changedBy: string,
    notes?: string,
  ) {
    const apps = await this.prisma.application.findMany({
      where: { tenantId, id: { in: applicationIds } },
    });

    if (apps.length !== applicationIds.length) {
      throw new NotFoundException('One or more applications not found');
    }

    await this.prisma.$transaction([
      this.prisma.application.updateMany({
        where: { tenantId, id: { in: applicationIds } },
        data: { stage },
      }),
      ...apps.map((app) =>
        this.prisma.stageHistory.create({
          data: {
            tenantId,
            applicationId: app.id,
            fromStage: app.stage,
            toStage: stage,
            changedBy,
            notes: notes ?? null,
          },
        }),
      ),
    ]);

    return { updated: apps.length };
  }

  async getStageHistory(tenantId: string, applicationId: string) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app || app.tenantId !== tenantId) throw new NotFoundException('Application not found');
    return this.prisma.stageHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
