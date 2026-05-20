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

const STAGES = ['APPLIED', 'SCREENED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'PLACED', 'REJECTED'];

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, status?: string, priority?: string) {
    return this.prisma.job.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
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
      include: {
        candidate: true,
        interviews: { orderBy: { scheduledAt: 'asc' } },
        stageHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, typeof applications> = {};
    for (const s of STAGES) grouped[s] = [];
    for (const app of applications) {
      const bucket = grouped[app.stage] ?? (grouped[app.stage] = []);
      bucket.push(app);
    }

    return { job, pipeline: grouped };
  }

  async metrics(tenantId: string, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');

    const applications = await this.prisma.application.findMany({
      where: { tenantId, jobId: id },
    });

    const total = applications.length;
    const byStage: Record<string, number> = {};
    for (const s of STAGES) byStage[s] = 0;
    for (const app of applications) {
      byStage[app.stage] = (byStage[app.stage] ?? 0) + 1;
    }

    const placed = applications.find((a) => a.stage === 'PLACED');
    const timeToDays = placed && job.postedAt
      ? Math.ceil(
          (new Date(placed.updatedAt).getTime() - new Date(job.postedAt).getTime()) /
          (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      jobId: id,
      totalApplications: total,
      byStage,
      timeToDays,
      conversionRates: Object.fromEntries(
        STAGES.map((s) => [
          s,
          total > 0 ? Math.round(((byStage[s] ?? 0) / total) * 100) : 0,
        ]),
      ),
    };
  }

  async exportCsv(tenantId: string, id: string): Promise<string> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');

    const applications = await this.prisma.application.findMany({
      where: { tenantId, jobId: id },
      include: { candidate: true },
      orderBy: { createdAt: 'asc' },
    });

    const header = 'Name,Email,Phone,Stage,Source,Applied Date,CV Link';
    const rows = applications.map((a) => {
      const c = a.candidate;
      return [
        `"${c.firstName} ${c.lastName}"`,
        `"${c.email}"`,
        `"${c.phone ?? ''}"`,
        `"${a.stage}"`,
        `"${c.source}"`,
        `"${new Date(a.createdAt).toISOString().split('T')[0]}"`,
        `"${c.cvUrl ?? ''}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
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
        priority: dto.priority ?? 'STANDARD',
        salaryMin: dto.salaryMin ?? null,
        salaryMax: dto.salaryMax ?? null,
        currency: dto.currency ?? 'RWF',
        headcount: dto.headcount ?? 1,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        requiredSkills: dto.requiredSkills ?? [],
        qualifications: dto.qualifications ?? null,
        clientId: dto.clientId ?? null,
        clientName: dto.clientName ?? null,
        consultantId: dto.consultantId ?? null,
        feeType: dto.feeType ?? null,
        feeValue: dto.feeValue ?? null,
        postedAt: dto.status === 'OPEN' ? new Date() : null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job || job.tenantId !== tenantId) throw new NotFoundException('Job not found');

    const data: Prisma.JobUpdateInput = { ...dto };
    if (dto.deadline) data.deadline = new Date(dto.deadline);
    if (dto.status === 'OPEN' && job.status !== 'OPEN') data.postedAt = new Date();
    if (dto.status === 'FILLED' || dto.status === 'CANCELLED') data.closedAt = new Date();

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
