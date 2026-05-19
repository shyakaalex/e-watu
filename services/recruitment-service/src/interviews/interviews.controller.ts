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
import { CreateInterviewDto, CreateScorecardDto } from './dtos/create-interview.dto';
import { UpdateInterviewDto } from './dtos/update-interview.dto';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('applicationId') applicationId?: string,
  ) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.findAll(tid, applicationId);
  }

  @Get(':id')
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
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateInterviewDto,
  ) {
    const tid = this.interviews.requireTenant(user.tenant_id);
    return this.interviews.update(tid, id, body);
  }
}
