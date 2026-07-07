import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { CreateVendorDto } from './dto/create-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'CREATE_VENDOR',
      resource: 'vendors',
      resourceId: vendor.id,
      payload: { name: vendor.name, email: vendor.email },
    });

    return vendor;
  }

  async findAll(tenantId: string) {
    return this.prisma.vendor.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }
}
