import {
  BadGatewayException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PublicApplyDto, PublicTalentPoolDto } from './dtos/public-apply.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async resolveTenantId(slug: string): Promise<string> {
    const base = this.config.get<string>('PLATFORM_SERVICE_URL')?.replace(/\/$/, '');
    const key = this.config.get<string>('INTERNAL_API_KEY');
    if (!base || !key) {
      throw new BadGatewayException('PLATFORM_SERVICE_URL not configured');
    }
    const r = await fetch(`${base}/api/v1/internal/tenants/by-slug/${encodeURIComponent(slug)}`, {
      headers: { 'x-internal-key': key },
    });
    if (r.status === 404) throw new NotFoundException('Company not found');
    if (!r.ok) throw new BadGatewayException('Could not resolve company');
    const data = (await r.json()) as { id: string; status: string };
    if (data.status !== 'ACTIVE') {
      throw new NotFoundException('Company not found');
    }
    return data.id;
  }

  async listOpenJobs(slug: string) {
    const tenantId = await this.resolveTenantId(slug);
    return this.prisma.job.findMany({
      where: { tenantId, status: 'OPEN' },
      orderBy: { postedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        department: true,
        location: true,
        type: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        postedAt: true,
      },
    });
  }

  async applyToJob(slug: string, jobId: string, dto: PublicApplyDto) {
    const tenantId = await this.resolveTenantId(slug);
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.tenantId !== tenantId || job.status !== 'OPEN') {
      throw new NotFoundException('Job not found');
    }

    const email = dto.email.toLowerCase();
    let candidate = await this.prisma.candidate.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          phone: dto.phone ?? null,
          cvUrl: dto.cvUrl ?? null,
          source: 'PORTAL',
          notes: dto.coverLetter ?? null,
        },
      });
    }

    try {
      const application = await this.prisma.application.create({
        data: {
          tenantId,
          jobId,
          candidateId: candidate.id,
          stage: 'APPLIED',
          notes: dto.coverLetter ?? null,
        },
      });
      return { message: 'Application submitted', applicationId: application.id };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You have already applied to this job');
      }
      throw e;
    }
  }

  async joinTalentPool(slug: string, dto: PublicTalentPoolDto) {
    const tenantId = await this.resolveTenantId(slug);
    const email = dto.email.toLowerCase();
    try {
      const candidate = await this.prisma.candidate.upsert({
        where: { tenantId_email: { tenantId, email } },
        create: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          phone: dto.phone ?? null,
          cvUrl: dto.cvUrl ?? null,
          currentTitle: dto.currentTitle ?? null,
          source: 'PORTAL',
        },
        update: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          ...(dto.cvUrl !== undefined ? { cvUrl: dto.cvUrl } : {}),
          ...(dto.currentTitle !== undefined ? { currentTitle: dto.currentTitle } : {}),
        },
      });
      return { message: 'Added to talent pool', candidateId: candidate.id };
    } catch (e) {
      throw e;
    }
  }
}
