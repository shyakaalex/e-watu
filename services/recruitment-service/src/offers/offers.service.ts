import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOfferDto } from './dtos/create-offer.dto';
import type { UpdateOfferDto } from './dtos/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, filters?: { jobId?: string; candidateId?: string; status?: string }) {
    return this.prisma.offer.findMany({
      where: {
        tenantId,
        ...(filters?.jobId ? { jobId: filters.jobId } : {}),
        ...(filters?.candidateId ? { candidateId: filters.candidateId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: {
        application: { include: { candidate: true, job: true } },
        placement: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        application: { include: { candidate: true, job: true } },
        placement: true,
      },
    });
    if (!offer || offer.tenantId !== tenantId) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(tenantId: string, dto: CreateOfferDto, createdBy: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });
    if (!application || application.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.offer.create({
      data: {
        tenantId,
        applicationId: dto.applicationId,
        jobId: dto.jobId,
        candidateId: dto.candidateId,
        salary: dto.salary,
        currency: dto.currency ?? 'RWF',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        probationDays: dto.probationDays ?? 90,
        status: dto.status ?? 'DRAFT',
        offerLetterUrl: dto.offerLetterUrl ?? null,
        counterNotes: dto.counterNotes ?? null,
        createdBy,
      },
      include: {
        application: { include: { candidate: true, job: true } },
        placement: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateOfferDto) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer || offer.tenantId !== tenantId) throw new NotFoundException('Offer not found');

    const data: Record<string, unknown> = {};
    if (dto.salary !== undefined) data.salary = dto.salary;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.probationDays !== undefined) data.probationDays = dto.probationDays;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.offerLetterUrl !== undefined) data.offerLetterUrl = dto.offerLetterUrl;
    if (dto.signatureStatus !== undefined) data.signatureStatus = dto.signatureStatus;
    if (dto.counterNotes !== undefined) data.counterNotes = dto.counterNotes;

    return this.prisma.offer.update({
      where: { id },
      data,
      include: {
        application: { include: { candidate: true, job: true } },
        placement: true,
      },
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
