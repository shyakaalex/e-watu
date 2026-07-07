import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateCandidateDto } from './dtos/create-candidate.dto';
import { UpdateCandidateDto } from './dtos/update-candidate.dto';
import { BulkImportRow, CandidatesService } from './candidates.service';

// ---------------------------------------------------------------------------
// Inline DTOs for sub-resources (no separate file required by the spec)
// ---------------------------------------------------------------------------

export class CreateWorkHistoryDto {
  employer: string;
  title: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities?: string;
}

export class UpdateWorkHistoryDto {
  employer?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
}

export class CreateEducationDto {
  institution: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export class UpdateEducationDto {
  institution?: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export class CreateLanguageDto {
  language: string;
  proficiency: string;
}

export class CreateDocumentDto {
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  label: string;
}

export class AddNoteDto {
  content: string;
}

export class UpdateStatusDto {
  status: string;
}

export class BulkImportDto {
  rows: BulkImportRow[];
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  // -------------------------------------------------------------------------
  // Core CRUD
  // -------------------------------------------------------------------------

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('source') source?: string,
    @Query('tags') tags?: string | string[],
    @Query('status') status?: string,
    @Query('availability') availability?: string,
    @Query('country') country?: string,
    @Query('minExperience') minExperience?: string,
    @Query('maxExperience') maxExperience?: string,
    @Query('skills') skills?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const tagList = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;
    const skillList = skills
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    return this.candidates.findAll(tid, {
      q,
      source,
      tags: tagList,
      status,
      availability,
      country,
      minExperience: minExperience ? Number(minExperience) : undefined,
      maxExperience: maxExperience ? Number(maxExperience) : undefined,
      skills: skillList,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.findOne(tid, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateCandidateDto) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.create(tid, body);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateCandidateDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.update(tid, id, body);
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.updateStatus(
      tid,
      id,
      'ARCHIVED',
      user.sub,
      user.preferred_username ?? user.email ?? user.sub,
    );
  }

  // -------------------------------------------------------------------------
  // Bulk import  (static segment first to avoid conflict with /:id)
  // -------------------------------------------------------------------------

  @Post('import/csv')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  bulkImport(@CurrentUser() user: AuthUser, @Body() body: BulkImportDto) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.bulkImport(tid, body.rows);
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  @Patch(':id/status')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.updateStatus(
      tid,
      id,
      body.status,
      user.sub,
      user.preferred_username ?? user.email ?? user.sub,
    );
  }

  // -------------------------------------------------------------------------
  // Work History
  // -------------------------------------------------------------------------

  @Get(':id/work-history')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  async getWorkHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const candidate = await this.candidates.findOne(tid, id);
    return (candidate as Record<string, unknown>)['workHistory'] ?? [];
  }

  @Post(':id/work-history')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addWorkHistory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateWorkHistoryDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.addWorkHistory(tid, id, body);
  }

  @Patch(':id/work-history/:histId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  updateWorkHistory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('histId') histId: string,
    @Body() body: UpdateWorkHistoryDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.updateWorkHistory(tid, id, histId, body);
  }

  @Delete(':id/work-history/:histId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  deleteWorkHistory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('histId') histId: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.deleteWorkHistory(tid, id, histId);
  }

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------

  @Post(':id/education')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addEducation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateEducationDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.addEducation(tid, id, body);
  }

  @Patch(':id/education/:eduId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  updateEducation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('eduId') eduId: string,
    @Body() body: UpdateEducationDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.updateEducation(tid, id, eduId, body);
  }

  @Delete(':id/education/:eduId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  deleteEducation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('eduId') eduId: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.deleteEducation(tid, id, eduId);
  }

  // -------------------------------------------------------------------------
  // Languages
  // -------------------------------------------------------------------------

  @Post(':id/languages')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addLanguage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateLanguageDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.addLanguage(tid, id, body);
  }

  @Delete(':id/languages/:langId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  deleteLanguage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('langId') langId: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.deleteLanguage(tid, id, langId);
  }

  // -------------------------------------------------------------------------
  // Documents (CV versions)
  // -------------------------------------------------------------------------

  @Get(':id/documents')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  async getDocuments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const candidate = await this.candidates.findOne(tid, id);
    return (candidate as Record<string, unknown>)['documents'] ?? [];
  }

  @Post(':id/documents')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addDocument(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateDocumentDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.addDocument(tid, id, body);
  }

  // -------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------

  @Get(':id/notes')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  async getNotes(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const candidate = await this.candidates.findOne(tid, id);
    return (candidate as Record<string, unknown>)['recruiterNotes'] ?? [];
  }

  @Post(':id/notes')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddNoteDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.addNote(
      tid,
      id,
      body.content,
      user.sub,
      user.preferred_username ?? user.email ?? user.sub,
    );
  }

  @Delete(':id/notes/:noteId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  deleteNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.deleteNote(tid, id, noteId);
  }

  // -------------------------------------------------------------------------
  // Activities
  // -------------------------------------------------------------------------

  @Get(':id/activities')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  async getActivities(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const candidate = await this.candidates.findOne(tid, id);
    return (candidate as Record<string, unknown>)['activities'] ?? [];
  }
}
