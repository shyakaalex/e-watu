import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateReceiptDto) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'APPROVED') {
      throw new BadRequestException('Can only create GRN for approved purchase orders');
    }

    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        tenantId,
        purchaseOrderId: dto.purchaseOrderId,
        receivedBy: userId,
        status: 'PENDING',
      },
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'CREATE_GRN',
      resource: 'goods_received_notes',
      resourceId: grn.id,
      payload: { purchaseOrderId: grn.purchaseOrderId },
    });

    return grn;
  }

  async approve(tenantId: string, id: string, userId: string) {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: { id, tenantId },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'PENDING') {
      throw new BadRequestException('Only pending GRNs can be approved');
    }

    const updated = await this.prisma.goodsReceivedNote.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    console.log(`[Event Bus] Emitting 'procurement.grn.approved' payload:`, {
      tenantId,
      grnId: id,
      purchaseOrderId: updated.purchaseOrderId,
      approvedBy: userId,
    });

    await this.auditLog.record({
      tenantId,
      userId,
      action: 'APPROVE_GRN',
      resource: 'goods_received_notes',
      resourceId: id,
      payload: { purchaseOrderId: updated.purchaseOrderId, status: updated.status },
    });

    return updated;
  }

  async findAll(tenantId: string) {
    return this.prisma.goodsReceivedNote.findMany({
      where: { tenantId },
      include: { purchaseOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: { id, tenantId },
      include: { purchaseOrder: true },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }
}
