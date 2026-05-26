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
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateStageDto, ApplicationStage } from './dtos/update-stage.dto';
import { ApplicationsService } from './applications.service';

class BulkStageDto {
  @IsArray()
  @IsString({ each: true })
  applicationIds: string[];

  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @Roles(
    EwatuRole.TENANT_ADMIN,
    EwatuRole.HR_MANAGER,
    EwatuRole.RECRUITER,
    EwatuRole.CLIENT_ADMIN,
  )
  list(
    @CurrentUser() user: AuthUser,
    @Query('jobId') jobId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('stage') stage?: string,
  ) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.findAll(tid, { jobId, candidateId, stage });
  }

  @Get(':id')
  @Roles(
    EwatuRole.TENANT_ADMIN,
    EwatuRole.HR_MANAGER,
    EwatuRole.RECRUITER,
    EwatuRole.CLIENT_ADMIN,
  )
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.findOne(tid, id);
  }

  @Get(':id/history')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  history(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.getStageHistory(tid, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateApplicationDto) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.create(tid, body);
  }

  @Patch(':id/stage')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  updateStage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateStageDto,
  ) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.updateStage(tid, id, body, user.sub);
  }

  @Post('bulk/stage')
  bulkStage(@CurrentUser() user: AuthUser, @Body() body: BulkStageDto) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.bulkUpdateStage(
      tid,
      body.applicationIds,
      body.stage,
      user.sub,
      body.notes,
    );
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  withdraw(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.withdraw(tid, id, user.sub);
  }
}
