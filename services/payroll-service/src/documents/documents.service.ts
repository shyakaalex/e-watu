import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DocumentCatalogEntry = {
  id: string;
  category: 'Employee Document' | 'Employment Contract';
  name: string;
  subjectName: string;
  uploadedAt: Date;
  expiryDate: Date | null;
  downloadUrl: string | null;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** EmployeeDocument.s3Key already includes the `tenants/<id>/` prefix (it's stored
   *  verbatim from the presign response's `key`); EmployeeContract.s3Key is the raw
   *  objectKey the caller chose, so it still needs that prefix added before asking
   *  document-service to sign it. The bucket is private, so a bare bucket URL 403s —
   *  every download link must go through a short-lived signed GET URL. */
  private async signDownloadUrl(s3Key: string, prefixed: boolean, tenantId: string): Promise<string | null> {
    const base = (process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3018').replace(/\/$/, '');
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return null;
    const key = prefixed ? s3Key : `tenants/${tenantId}/${s3Key}`;

    try {
      const response = await fetch(`${base}/api/v1/document/internal/presign-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { data?: { downloadUrl: string } };
      return body.data?.downloadUrl ?? null;
    } catch {
      return null;
    }
  }

  async listAll(tenantId: string, search?: string): Promise<DocumentCatalogEntry[]> {
    const [employeeDocs, contracts] = await Promise.all([
      this.prisma.employeeDocument.findMany({
        where: { tenantId },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.employeeContract.findMany({
        where: { tenantId, s3Key: { not: null } },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const entries: DocumentCatalogEntry[] = await Promise.all([
      ...employeeDocs.map(async (d) => ({
        id: d.id,
        category: 'Employee Document' as const,
        name: d.name,
        subjectName: `${d.employee.firstName} ${d.employee.lastName}`,
        uploadedAt: d.uploadedAt,
        expiryDate: d.expiryDate,
        downloadUrl: await this.signDownloadUrl(d.s3Key, true, tenantId),
      })),
      ...contracts.map(async (c) => ({
        id: c.id,
        category: 'Employment Contract' as const,
        name: `${c.contractType.replace('_', ' ')} contract`,
        subjectName: `${c.employee.firstName} ${c.employee.lastName}`,
        uploadedAt: c.createdAt,
        expiryDate: c.endDate,
        downloadUrl: c.s3Key ? await this.signDownloadUrl(c.s3Key, false, tenantId) : null,
      })),
    ]);
    entries.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    if (!search?.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.subjectName.toLowerCase().includes(q),
    );
  }
}
