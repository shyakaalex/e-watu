import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateJobDto } from './dtos/create-job.dto';
import type { UpdateJobDto } from './dtos/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, status?: string) {
    return this.prisma.job.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');
    return job;
  }

  async pipeline(tenantId: string, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');

    const applications = await this.prisma.application.findMany({
      where: { tenantId, jobId: id },
      include: { candidate: true, interviews: { orderBy: { scheduledAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });

    const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
    const grouped: Record<string, typeof applications> = {};
    for (const s of stages) grouped[s] = [];
    for (const app of applications) {
      const bucket = grouped[app.stage] ?? (grouped[app.stage] = []);
      bucket.push(app);
    }

    return { job, pipeline: grouped };
  }

  async create(tenantId: string, dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description ?? null,
        department: dto.department ?? null,
        location: dto.location ?? null,
        type: dto.type ?? 'FULL_TIME',
        status: dto.status ?? 'DRAFT',
        salaryMin: dto.salaryMin ?? null,
        salaryMax: dto.salaryMax ?? null,
        currency: dto.currency ?? 'RWF',
        headcount: dto.headcount ?? 1,
        postedAt: dto.status === 'OPEN' ? new Date() : null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');

    const data: Prisma.JobUpdateInput = { ...dto };
    if (dto.status === 'OPEN' && job.status !== 'OPEN') data.postedAt = new Date();
    if (dto.status === 'CLOSED' || dto.status === 'FILLED') data.closedAt = new Date();

    return this.prisma.job.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');
    if (job.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT jobs can be deleted');
    }
    return this.prisma.job.delete({ where: { id } });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
