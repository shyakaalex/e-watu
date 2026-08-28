import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CandidateDocumentEntry = {
  id: string;
  category: 'Candidate Document';
  name: string;
  subjectName: string;
  uploadedAt: Date;
  expiryDate: null;
  downloadUrl: string | null;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** fileUrl is the bare (unsigned) bucket URL from the upload-time presign response —
   *  the bucket is private, so that link 403s. fileKey is the exact stored S3 key
   *  (already includes the `tenants/<id>/` prefix), which document-service can sign
   *  into a short-lived GET URL for actual downloads. */
  private async signDownloadUrl(fileKey: string): Promise<string | null> {
    const base = (process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3018').replace(/\/$/, '');
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return null;

    try {
      const response = await fetch(`${base}/api/v1/document/internal/presign-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
        body: JSON.stringify({ key: fileKey }),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { data?: { downloadUrl: string } };
      return body.data?.downloadUrl ?? null;
    } catch {
      return null;
    }
  }

  async listAll(tenantId: string, search?: string): Promise<CandidateDocumentEntry[]> {
    const docs = await this.prisma.candidateDocument.findMany({
      where: { tenantId },
      include: { candidate: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const entries: CandidateDocumentEntry[] = await Promise.all(
      docs.map(async (d) => ({
        id: d.id,
        category: 'Candidate Document' as const,
        name: `${d.label} (${d.fileName})`,
        subjectName: `${d.candidate.firstName} ${d.candidate.lastName}`,
        uploadedAt: d.createdAt,
        expiryDate: null,
        downloadUrl: await this.signDownloadUrl(d.fileKey),
      })),
    );

    if (!search?.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.subjectName.toLowerCase().includes(q),
    );
  }
}
