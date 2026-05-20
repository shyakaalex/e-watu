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
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateInterviewDto, CreateScorecardDto } from './dtos/create-interview.dto';
import { UpdateInterviewDto } from './dtos/update-interview.dto';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('applicationId') applicationId?: string,
  ) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.findAll(tid, applicationId);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.findOne(tid, id);
  }

  @Get(':id/scorecards')
  scorecards(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.getScorecards(tid, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateInterviewDto) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.create(tid, body);
  }

  @Post(':id/scorecards')
  addScorecard(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateScorecardDto,
  ) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.addScorecard(tid, id, body, user.sub);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateInterviewDto,
  ) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.update(tid, id, body);
  }
}
