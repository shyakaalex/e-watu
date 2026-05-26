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
import { CandidatesService } from './candidates.service';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('source') source?: string,
    @Query('tags') tags?: string | string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    const tagList = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;
    return this.candidates.findAll(tid, {
      q,
      source,
      tags: tagList,
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
    return this.candidates.archive(tid, id);
  }
}
