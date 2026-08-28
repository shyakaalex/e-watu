import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, employeeId: string, dto: CreateContractDto) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.employeeContract.create({
      data: {
        tenantId,
        employeeId,
        contractType: dto.contractType,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        salary: dto.salary,
        currency: dto.currency ?? 'RWF',
        status: 'ACTIVE',
      },
    });
  }

  findByEmployee(tenantId: string, employeeId: string) {
    return this.prisma.employeeContract.findMany({
      where: { tenantId, employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const contract = await this.prisma.employeeContract.findFirst({
      where: { id, tenantId },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto) {
    await this.findOne(tenantId, id);
    return this.prisma.employeeContract.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async uploadContract(tenantId: string, id: string, contentType: string, fileSize: number) {
    const contract = await this.findOne(tenantId, id);
    const objectKey = `contracts/${tenantId}/${contract.id}/contract.pdf`;
    const presign = await this.requestPresign(tenantId, objectKey, contentType, fileSize);

    await this.prisma.employeeContract.update({
      where: { id: contract.id },
      data: { s3Key: objectKey },
    });

    return { uploadUrl: presign.uploadUrl, objectKey };
  }

  async findExpiring(tenantId: string, days: number) {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.employeeContract.findMany({
      where: { tenantId, status: 'ACTIVE', endDate: { not: null, gte: now, lte: end } },
      include: {
        employee: { select: { firstName: true, lastName: true, clientId: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  private async requestPresign(
    tenantId: string,
    objectKey: string,
    contentType: string,
    fileSize: number,
  ): Promise<{ uploadUrl: string; key: string }> {
    const base = (process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3018').replace(/\/$/, '');
    const key = process.env.INTERNAL_API_KEY;
    if (!key) throw new ServiceUnavailableException('Document service not configured');

    const response = await fetch(`${base}/api/v1/document/internal/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({ tenantId, objectKey, contentType, fileSize }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Failed to obtain upload URL from document service');
    }

    const body = (await response.json()) as { data?: { uploadUrl: string; key: string } };
    if (!body.data?.uploadUrl || !body.data?.key) {
      throw new ServiceUnavailableException('Document service returned an unexpected response');
    }
    return body.data;
  }
}
