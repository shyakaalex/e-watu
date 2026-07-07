import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCandidateDto } from './dtos/create-candidate.dto';
import type { UpdateCandidateDto } from './dtos/update-candidate.dto';

export type FindAllCandidatesFilters = {
  q?: string;
  source?: string;
  tags?: string[];
  status?: string;
  availability?: string;
  skills?: string[];
  country?: string;
  minExperience?: number;
  maxExperience?: number;
  page?: number;
  limit?: number;
};

export type CreateWorkHistoryDto = {
  employer: string;
  title: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  isCurrent: boolean;
  responsibilities?: string | null;
};

export type UpdateWorkHistoryDto = Partial<CreateWorkHistoryDto>;

export type CreateEducationDto = {
  institution: string;
  degree?: string | null;
  field?: string | null;
  startYear?: number | null;
  endYear?: number | null;
};

export type UpdateEducationDto = Partial<CreateEducationDto>;

export type CreateLanguageDto = {
  language: string;
  proficiency: string;
};

export type CreateDocumentDto = {
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  label: string;
};

export type BulkImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentEmployer?: string;
  skills?: string[];
  source?: string;
};

export type BulkImportResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
};

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Core CRUD
  // ---------------------------------------------------------------------------

  findAll(tenantId: string, filters: FindAllCandidatesFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {
      tenantId,
      archived: false,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.availability ? { availability: filters.availability } : {}),
      ...(filters.country ? { country: filters.country } : {}),
      // tags and skills both use hasSome — merge into a single array
      ...((filters.tags?.length || filters.skills?.length)
        ? {
            tags: {
              hasSome: [
                ...(filters.tags ?? []),
                ...(filters.skills ?? []),
              ],
            },
          }
        : {}),
      ...(filters.minExperience != null || filters.maxExperience != null
        ? {
            yearsExperience: {
              ...(filters.minExperience != null ? { gte: filters.minExperience } : {}),
              ...(filters.maxExperience != null ? { lte: filters.maxExperience } : {}),
            },
          }
        : {}),
    };

    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { currentTitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async findOne(tenantId: string, id: string) {
    const c = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        applications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
        },
        workHistory: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startYear: 'desc' },
        },
        languages: true,
        documents: {
          orderBy: { version: 'desc' },
        },
        recruiterNotes: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!c) throw new NotFoundException('Candidate not found');
    return c;
  }

  async create(tenantId: string, dto: CreateCandidateDto & {
    dob?: Date | string | null;
    gender?: string | null;
    nationality?: string | null;
    city?: string | null;
    country?: string | null;
    contactPreference?: string | null;
    communicationLanguage?: string | null;
    currentEmployer?: string | null;
    yearsExperience?: number | null;
    employmentStatus?: string | null;
    summary?: string | null;
    salaryExpMin?: number | null;
    salaryExpMax?: number | null;
    salaryCurrency?: string | null;
    availability?: string | null;
    availableFrom?: Date | string | null;
    status?: string | null;
  }) {
    try {
      const candidate = await this.prisma.candidate.create({
        data: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          phone: dto.phone ?? null,
          cvUrl: dto.cvUrl ?? null,
          linkedinUrl: dto.linkedinUrl ?? null,
          currentTitle: dto.currentTitle ?? null,
          source: dto.source ?? 'MANUAL',
          notes: dto.notes ?? null,
          tags: dto.tags ?? [],
          // Extended profile fields
          dob: dto.dob ? new Date(dto.dob) : null,
          gender: dto.gender ?? null,
          nationality: dto.nationality ?? null,
          city: dto.city ?? null,
          country: dto.country ?? null,
          contactPreference: dto.contactPreference ?? null,
          communicationLanguage: dto.communicationLanguage ?? 'English',
          currentEmployer: dto.currentEmployer ?? null,
          yearsExperience: dto.yearsExperience ?? null,
          employmentStatus: dto.employmentStatus ?? null,
          summary: dto.summary ?? null,
          salaryExpMin: dto.salaryExpMin ?? null,
          salaryExpMax: dto.salaryExpMax ?? null,
          salaryCurrency: dto.salaryCurrency ?? 'RWF',
          availability: dto.availability ?? 'IMMEDIATE',
          availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
          status: dto.status ?? 'ACTIVE',
        },
      });

      this.logActivity(candidate.id, tenantId, 'PROFILE_CREATED', 'Candidate profile created', null, null);

      return candidate;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        await this.throwDuplicateEmail(tenantId, dto.email);
      }
      throw e;
    }
  }

  async update(tenantId: string, id: string, dto: UpdateCandidateDto & {
    dob?: Date | string | null;
    gender?: string | null;
    nationality?: string | null;
    city?: string | null;
    country?: string | null;
    contactPreference?: string | null;
    communicationLanguage?: string | null;
    currentEmployer?: string | null;
    yearsExperience?: number | null;
    employmentStatus?: string | null;
    summary?: string | null;
    salaryExpMin?: number | null;
    salaryExpMax?: number | null;
    salaryCurrency?: string | null;
    availability?: string | null;
    availableFrom?: Date | string | null;
    status?: string | null;
    authorId?: string | null;
  }) {
    const c = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Candidate not found');

    const authorId = dto.authorId ?? null;
    // Remove service-only field before passing to prisma
    const { authorId: _authorId, dob, availableFrom, ...rest } = dto;

    try {
      const updated = await this.prisma.candidate.update({
        where: { id },
        data: {
          ...rest,
          email: dto.email?.toLowerCase(),
          ...(dob !== undefined ? { dob: dob ? new Date(dob) : null } : {}),
          ...(availableFrom !== undefined ? { availableFrom: availableFrom ? new Date(availableFrom) : null } : {}),
        },
      });

      this.logActivity(id, tenantId, 'PROFILE_UPDATED', 'Profile updated', null, authorId ?? undefined);

      return updated;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        await this.throwDuplicateEmail(tenantId, dto.email ?? c.email);
      }
      throw e;
    }
  }

  async archive(tenantId: string, id: string) {
    const c = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Candidate not found');
    return this.prisma.candidate.update({
      where: { id },
      data: { status: 'ARCHIVED', archived: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Work History
  // ---------------------------------------------------------------------------

  async addWorkHistory(
    tenantId: string,
    candidateId: string,
    dto: CreateWorkHistoryDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);

    const record = await this.prisma.workHistory.create({
      data: {
        tenantId,
        candidateId,
        employer: dto.employer,
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent,
        responsibilities: dto.responsibilities ?? null,
      },
    });

    this.logActivity(
      candidateId,
      tenantId,
      'WORK_HISTORY_ADDED',
      `Added work history: ${dto.title} at ${dto.employer}`,
      null,
      undefined,
    );

    return record;
  }

  async updateWorkHistory(
    tenantId: string,
    candidateId: string,
    historyId: string,
    dto: UpdateWorkHistoryDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.workHistory.findFirst({
      where: { id: historyId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Work history record not found');

    return this.prisma.workHistory.update({
      where: { id: historyId },
      data: {
        ...(dto.employer !== undefined ? { employer: dto.employer } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
        ...(dto.responsibilities !== undefined ? { responsibilities: dto.responsibilities } : {}),
      },
    });
  }

  async deleteWorkHistory(tenantId: string, candidateId: string, historyId: string) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.workHistory.findFirst({
      where: { id: historyId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Work history record not found');
    return this.prisma.workHistory.delete({ where: { id: historyId } });
  }

  // ---------------------------------------------------------------------------
  // Education
  // ---------------------------------------------------------------------------

  async addEducation(
    tenantId: string,
    candidateId: string,
    dto: CreateEducationDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);

    const record = await this.prisma.education.create({
      data: {
        tenantId,
        candidateId,
        institution: dto.institution,
        degree: dto.degree ?? null,
        field: dto.field ?? null,
        startYear: dto.startYear ?? null,
        endYear: dto.endYear ?? null,
      },
    });

    this.logActivity(
      candidateId,
      tenantId,
      'EDUCATION_ADDED',
      `Added education: ${dto.institution}`,
      null,
      undefined,
    );

    return record;
  }

  async updateEducation(
    tenantId: string,
    candidateId: string,
    educationId: string,
    dto: UpdateEducationDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.education.findFirst({
      where: { id: educationId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Education record not found');

    return this.prisma.education.update({
      where: { id: educationId },
      data: {
        ...(dto.institution !== undefined ? { institution: dto.institution } : {}),
        ...(dto.degree !== undefined ? { degree: dto.degree } : {}),
        ...(dto.field !== undefined ? { field: dto.field } : {}),
        ...(dto.startYear !== undefined ? { startYear: dto.startYear } : {}),
        ...(dto.endYear !== undefined ? { endYear: dto.endYear } : {}),
      },
    });
  }

  async deleteEducation(tenantId: string, candidateId: string, educationId: string) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.education.findFirst({
      where: { id: educationId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Education record not found');
    return this.prisma.education.delete({ where: { id: educationId } });
  }

  // ---------------------------------------------------------------------------
  // Languages
  // ---------------------------------------------------------------------------

  async addLanguage(
    tenantId: string,
    candidateId: string,
    dto: CreateLanguageDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);

    const record = await this.prisma.candidateLanguage.create({
      data: {
        tenantId,
        candidateId,
        language: dto.language,
        proficiency: dto.proficiency,
      },
    });

    this.logActivity(
      candidateId,
      tenantId,
      'LANGUAGE_ADDED',
      `Added language: ${dto.language} (${dto.proficiency})`,
      null,
      undefined,
    );

    return record;
  }

  async deleteLanguage(tenantId: string, candidateId: string, languageId: string) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.candidateLanguage.findFirst({
      where: { id: languageId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Language record not found');
    return this.prisma.candidateLanguage.delete({ where: { id: languageId } });
  }

  // ---------------------------------------------------------------------------
  // Documents (CV versions)
  // ---------------------------------------------------------------------------

  async addDocument(
    tenantId: string,
    candidateId: string,
    dto: CreateDocumentDto,
  ) {
    await this.ensureCandidate(tenantId, candidateId);

    // Auto-increment version for documents with same label
    const existingCount = await this.prisma.candidateDocument.count({
      where: { candidateId, tenantId, label: dto.label },
    });
    const version = existingCount + 1;

    const doc = await this.prisma.candidateDocument.create({
      data: {
        tenantId,
        candidateId,
        fileName: dto.fileName,
        fileKey: dto.fileKey,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        label: dto.label,
        version,
      },
    });

    // Update candidate cvUrl if label is 'CV'
    if (dto.label === 'CV') {
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { cvUrl: dto.fileUrl },
      });
    }

    this.logActivity(
      candidateId,
      tenantId,
      'DOCUMENT_UPLOADED',
      `Uploaded document: ${dto.fileName} (${dto.label} v${version})`,
      { label: dto.label, version, fileName: dto.fileName },
      undefined,
    );

    return doc;
  }

  // ---------------------------------------------------------------------------
  // Recruiter Notes
  // ---------------------------------------------------------------------------

  async addNote(
    tenantId: string,
    candidateId: string,
    content: string,
    authorId: string,
    authorName: string,
  ) {
    await this.ensureCandidate(tenantId, candidateId);

    const note = await this.prisma.recruiterNote.create({
      data: {
        tenantId,
        candidateId,
        content,
        authorId,
        authorName,
      },
    });

    this.logActivity(
      candidateId,
      tenantId,
      'NOTE_ADDED',
      'Recruiter note added',
      null,
      authorId,
    );

    return note;
  }

  async deleteNote(tenantId: string, candidateId: string, noteId: string) {
    await this.ensureCandidate(tenantId, candidateId);
    const existing = await this.prisma.recruiterNote.findFirst({
      where: { id: noteId, candidateId, tenantId },
    });
    if (!existing) throw new NotFoundException('Note not found');
    return this.prisma.recruiterNote.delete({ where: { id: noteId } });
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  async updateStatus(
    tenantId: string,
    candidateId: string,
    status: string,
    userId: string,
    userName: string,
  ) {
    const c = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });
    if (!c) throw new NotFoundException('Candidate not found');

    const oldStatus = c.status;

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status },
    });

    this.logActivity(
      candidateId,
      tenantId,
      'STATUS_CHANGED',
      `Status changed from ${oldStatus} to ${status} by ${userName}`,
      { from: oldStatus, to: status },
      userId,
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Bulk CSV Import
  // ---------------------------------------------------------------------------

  async bulkImport(tenantId: string, rows: BulkImportRow[]): Promise<BulkImportResult> {
    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row: BulkImportRow | undefined = rows[i];
      const rowNumber = i + 1;

      if (!row || !row.email || !row.firstName || !row.lastName) {
        errors.push({ row: rowNumber, error: 'Missing required fields: firstName, lastName, email' });
        continue;
      }

      const email = row.email.toLowerCase().trim();

      try {
        // Check for existing candidate by email within the same tenant
        const existing = await this.prisma.candidate.findUnique({
          where: { tenantId_email: { tenantId, email } },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const candidate = await this.prisma.candidate.create({
          data: {
            tenantId,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email,
            phone: row.phone?.trim() ?? null,
            currentTitle: row.currentTitle?.trim() ?? null,
            tags: row.skills ?? [],
            source: row.source ?? 'MANUAL',
          },
        });

        this.logActivity(
          candidate.id,
          tenantId,
          'PROFILE_CREATED',
          'Candidate profile created via bulk import',
          { importRow: rowNumber },
          undefined,
        );

        created++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: rowNumber, error: message });
      }
    }

    return { created, skipped, errors };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async logActivity(
    candidateId: string,
    tenantId: string,
    type: string,
    description: string,
    metadata?: Record<string, unknown> | null,
    userId?: string | null,
  ): Promise<void> {
    this.prisma.candidateActivity
      .create({
        data: {
          tenantId,
          candidateId,
          type,
          description,
          ...(metadata != null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
          userId: userId ?? null,
        },
      })
      .catch(() => {
        // fire-and-forget — swallow errors to avoid disrupting callers
      });
  }

  private async ensureCandidate(tenantId: string, candidateId: string) {
    const c = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Candidate not found');
  }

  private async throwDuplicateEmail(tenantId: string, email: string) {
    const existing = await this.prisma.candidate.findUnique({
      where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    });
    throw new ConflictException({
      message: 'Candidate with this email already exists',
      existingId: existing?.id,
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
