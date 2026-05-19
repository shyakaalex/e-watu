import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
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
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
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
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.findOne(tid, id);
  }

  @Get(':id/history')
  history(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.getStageHistory(tid, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateApplicationDto) {
    const tid = this.applications.requireTenant(user.tenant_id);
    return this.applications.create(tid, body);
  }

  @Patch(':id/stage')
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
}
