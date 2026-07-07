import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateOrderDto) {
    const requisition = await this.prisma.procurementRequisition.findFirst({
      where: { id: dto.requisitionId, tenantId },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    if (requisition.status !== 'APPROVED') {
      throw new BadRequestException('Can only create purchase orders for approved requisitions');
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        requisitionId: dto.requisitionId,
        totalAmount: requisition.totalAmount,
        status: 'DRAFT',
      },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'CREATE_PURCHASE_ORDER',
      resource: 'purchase_orders',
      resourceId: po.id,
      payload: { requisitionId: po.requisitionId, vendorId: po.vendorId, totalAmount: po.totalAmount },
    });

    return po;
  }

  async approve(tenantId: string, id: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Only draft purchase orders can be approved');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'APPROVE_PURCHASE_ORDER',
      resource: 'purchase_orders',
      resourceId: id,
      payload: { status: updated.status, approvedBy: userId },
    });

    return updated;
  }

  async findAll(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { vendor: true, requisition: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { vendor: true, requisition: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }
}
