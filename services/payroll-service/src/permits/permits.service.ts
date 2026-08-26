import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const WORK_PERMIT_RW = [
  'Passport Bio Page Copy',
  'Academic Degree Certificate',
  'Signed Employment Contract',
  'RRA Tax Clearance Certificate',
  'Rwanda Police Clearance Certificate',
];
const WORK_PERMIT_DEFAULT = ['Passport Copy', 'Signed Employment Contract', 'Police Clearance Certificate'];
const VISA_DEFAULT = [
  'Passport Copy',
  'Official Invitation Letter',
  'Recent Passport Photo',
  'Proof of Yellow Fever Vaccination',
];
const RESIDENCE_PERMIT_DEFAULT = ['Passport Copy', 'Local Address Declaration Form', 'Sponsor Letter'];

function checklistFor(permitType: string, country: string): string[] {
  if (permitType === 'WORK_PERMIT') return country === 'RW' ? WORK_PERMIT_RW : WORK_PERMIT_DEFAULT;
  if (permitType === 'VISA') return VISA_DEFAULT;
  return RESIDENCE_PERMIT_DEFAULT;
}

@Injectable()
export class PermitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPermits(tenantId: string, status?: string) {
    return this.prisma.permit.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: { employee: true, checklistItems: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getPermit(tenantId: string, id: string) {
    const permit = await this.prisma.permit.findUnique({
      where: { id },
      include: { employee: true, checklistItems: { orderBy: { createdAt: 'asc' } } },
    });
    if (!permit || permit.tenantId !== tenantId) {
      throw new NotFoundException('Permit case not found');
    }
    return permit;
  }

  async createPermit(
    tenantId: string,
    body: {
      employeeId: string;
      permitNumber: string;
      permitType: 'WORK_PERMIT' | 'VISA' | 'RESIDENCE_PERMIT';
      country?: string;
      expiryDate: string;
    },
  ) {
    const country = body.country || 'RW';
    const checklist = checklistFor(body.permitType, country);

    return this.prisma.permit.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        permitNumber: body.permitNumber,
        permitType: body.permitType,
        country,
        expiryDate: new Date(body.expiryDate),
        status: 'APPROVED',
        checklistItems: {
          create: checklist.map((documentName) => ({ tenantId, documentName, status: 'PENDING' })),
        },
      },
      include: { checklistItems: true, employee: true },
    });
  }

  async updateChecklistItem(
    tenantId: string,
    permitId: string,
    itemId: string,
    body: { status: 'PENDING' | 'UPLOADED' | 'VERIFIED'; fileKey?: string },
  ) {
    const permit = await this.prisma.permit.findUnique({ where: { id: permitId } });
    if (!permit || permit.tenantId !== tenantId) {
      throw new NotFoundException('Permit case not found');
    }

    const item = await this.prisma.permitChecklistItem.findUnique({ where: { id: itemId } });
    if (!item || item.permitId !== permitId) {
      throw new BadRequestException('Checklist item not found on this permit case');
    }

    return this.prisma.permitChecklistItem.update({
      where: { id: itemId },
      data: { status: body.status, ...(body.fileKey !== undefined ? { fileKey: body.fileKey } : {}) },
    });
  }
}
