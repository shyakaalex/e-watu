import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';

@Injectable()
export class RequisitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateRequisitionDto) {
    const requisition = await this.prisma.procurementRequisition.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        totalAmount: dto.totalAmount,
        requestedBy: userId,
        tenantId,
        status: 'DRAFT',
      },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'CREATE_REQUISITION',
      resource: 'procurement_requisitions',
      resourceId: requisition.id,
      payload: { title: requisition.title, totalAmount: requisition.totalAmount },
    });

    return requisition;
  }

  async submit(tenantId: string, id: string, userId: string) {
    const requisition = await this.prisma.procurementRequisition.findFirst({
      where: { id, tenantId },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    if (requisition.status !== 'DRAFT') {
      throw new BadRequestException('Only draft requisitions can be submitted');
    }

    const updated = await this.prisma.procurementRequisition.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'SUBMIT_REQUISITION',
      resource: 'procurement_requisitions',
      resourceId: id,
      payload: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  async approve(tenantId: string, id: string, userId: string) {
    const requisition = await this.prisma.procurementRequisition.findFirst({
      where: { id, tenantId },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    if (requisition.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted requisitions can be approved');
    }

    const updated = await this.prisma.procurementRequisition.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'APPROVE_REQUISITION',
      resource: 'procurement_requisitions',
      resourceId: id,
      payload: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  async findAll(tenantId: string) {
    return this.prisma.procurementRequisition.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const requisition = await this.prisma.procurementRequisition.findFirst({
      where: { id, tenantId },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    return requisition;
  }
}
