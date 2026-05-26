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
import { AddCandidateDto } from './dto/add-candidate.dto';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';
import { PoolsService } from './pools.service';

@Controller('pools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoolsController {
  constructor(private readonly pools: PoolsService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('tags') tags?: string | string[],
  ) {
    const tid = this.pools.requireTenant(user.tenant_id);
    const tagList = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;
    return this.pools.findAll(tid, tagList);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePoolDto) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.create(tid, body);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.findOne(tid, id);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdatePoolDto,
  ) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.update(tid, id, body);
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.remove(tid, id);
  }

  @Post(':id/candidates')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  addCandidate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddCandidateDto,
  ) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.addCandidate(tid, id, body);
  }

  @Delete(':id/candidates/:candidateId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  removeCandidate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string,
  ) {
    const tid = this.pools.requireTenant(user.tenant_id);
    return this.pools.removeCandidate(tid, id, candidateId);
  }
}
