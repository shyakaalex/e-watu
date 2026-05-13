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
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.findAll(tid, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.findOne(tid, id);
  }

  @Get(':id/pipeline')
  pipeline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.pipeline(tid, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateJobDto) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.create(tid, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
  ) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.update(tid, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.jobs.requireTenant(user.tenant_id);
    return this.jobs.remove(tid, id);
  }
}
