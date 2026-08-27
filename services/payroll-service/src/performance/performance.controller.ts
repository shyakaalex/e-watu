import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { PerformanceService } from './performance.service';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  // --- APPRAISAL CYCLES ---

  @Get('cycles')
  listCycles(@CurrentUser() user: AuthUser) {
    return this.service.listCycles(user.tenant_id as string);
  }

  @Post('cycles')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  createCycle(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      frequency: string;
      startDate: string;
      endDate: string;
      selfAssessmentDeadline: string;
      managerReviewDeadline: string;
      hrValidationDeadline: string;
      clientId?: string;
    },
  ) {
    return this.service.createCycle(user.tenant_id as string, body);
  }

  @Patch('cycles/:id/status')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  updateCycleStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' },
  ) {
    return this.service.updateCycleStatus(user.tenant_id as string, id, body.status);
  }

  // --- GOALS ---

  @Get('goals')
  listGoals(
    @CurrentUser() user: AuthUser,
    @Query('employeeId') employeeId?: string,
    @Query('appraisalCycleId') appraisalCycleId?: string,
  ) {
    return this.service.listGoals(user.tenant_id as string, employeeId, appraisalCycleId, user.permissions);
  }

  @Post('goals')
  createGoal(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      employeeId: string;
      appraisalCycleId: string;
      title: string;
      description?: string;
      target: string;
      measurementMethod: string;
      weight: number;
      deadline: string;
    },
  ) {
    return this.service.createGoal(user.tenant_id as string, body);
  }

  @Patch('goals/:id')
  updateGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      description: string;
      target: string;
      measurementMethod: string;
      weight: number;
      deadline: string;
      status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
      progress: number;
      managerComment: string;
    }>,
  ) {
    return this.service.updateGoal(user.tenant_id as string, id, body);
  }

  @Delete('goals/:id')
  deleteGoal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteGoal(user.tenant_id as string, id);
  }

  // --- GOAL TEMPLATES ---

  @Get('goals/templates')
  listGoalTemplates(@CurrentUser() user: AuthUser) {
    return this.service.listGoalTemplates(user.tenant_id as string);
  }

  @Post('goals/templates')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  createGoalTemplate(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      target: string;
      measurementMethod: string;
      weight: number;
      roleType?: string;
    },
  ) {
    return this.service.createGoalTemplate(user.tenant_id as string, body);
  }

  // --- COMPETENCY FRAMEWORKS ---

  @Get('competencies')
  getCompetencies(@CurrentUser() user: AuthUser) {
    return this.service.getCompetencyFramework(user.tenant_id as string);
  }

  // --- APPRAISALS ---

  @Get('appraisals')
  listAppraisals(
    @CurrentUser() user: AuthUser,
    @Query('employeeId') employeeId?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.service.listAppraisals(user.tenant_id as string, employeeId, managerId, user.permissions);
  }

  @Get('appraisals/:id')
  getAppraisal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getAppraisal(user.tenant_id as string, id, user.permissions);
  }

  @Post('appraisals/:id/self-assess')
  submitSelfAssessment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      selfComment?: string;
      goalRatings: Array<{ goalId: string; rating: number; comment?: string }>;
      competencyRatings: Array<{ competencyId: string; rating: number; comment?: string }>;
    },
  ) {
    return this.service.submitSelfAssessment(user.tenant_id as string, id, body);
  }

  @Post('appraisals/:id/manager-review')
  submitManagerReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      managerComment?: string;
      managerAdjustment?: number;
      goalRatings: Array<{ goalId: string; rating: number; comment?: string }>;
      competencyRatings: Array<{ competencyId: string; rating: number; comment?: string }>;
    },
  ) {
    return this.service.submitManagerReview(user.tenant_id as string, id, body);
  }

  @Post('appraisals/:id/hr-validate')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  submitHRValidation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { hrComment?: string; hrScore?: number },
  ) {
    return this.service.submitHRValidation(user.tenant_id as string, id, body);
  }

  // --- 360-DEGREE FEEDBACK ---

  @Get('360-feedback/requests')
  listFeedbackRequests(
    @CurrentUser() user: AuthUser,
    @Query('reviewerId') reviewerId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.service.listFeedbackRequests(user.tenant_id as string, reviewerId, employeeId, user.permissions);
  }

  @Post('360-feedback/requests')
  createFeedbackRequest(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      appraisalId: string;
      employeeId: string;
      reviewerId: string;
      relationship: 'PEER' | 'SUBORDINATE' | 'MANAGER';
    },
  ) {
    return this.service.createFeedbackRequest(user.tenant_id as string, body);
  }

  @Post('360-feedback/requests/:id/response')
  submitFeedbackResponse(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      anonymized?: boolean;
      competencyRatings: Record<string, { rating: number; comment?: string }>;
      generalComment?: string;
    },
  ) {
    return this.service.submitFeedbackResponse(user.tenant_id as string, id, body);
  }

  // --- PERFORMANCE IMPROVEMENT PLANS (PIPs) ---

  @Get('pips')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  listPips(
    @CurrentUser() user: AuthUser,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listPips(user.tenant_id as string, employeeId, status, user.permissions);
  }

  @Get('pips/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  getPip(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getPip(user.tenant_id as string, id, user.permissions);
  }

  @Post('pips')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  createPip(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      employeeId: string;
      appraisalId?: string;
      managerId?: string;
      reason: string;
      objectives: string;
      supportProvided?: string;
      startDate: string;
      reviewDate: string;
    },
  ) {
    return this.service.createPip(user.tenant_id as string, user.sub, body);
  }

  @Patch('pips/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  updatePip(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      status: 'ACTIVE' | 'EXTENDED' | 'SUCCEEDED' | 'ESCALATED' | 'CLOSED';
      reviewDate: string;
      endDate: string;
      outcome: string;
    }>,
  ) {
    return this.service.updatePip(user.tenant_id as string, id, body);
  }

  @Post('pips/:id/check-ins')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  addPipCheckIn(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note: string; status?: string },
  ) {
    return this.service.addPipCheckIn(user.tenant_id as string, id, body);
  }

  // --- KPI PERIODS ---

  @Get('kpi-periods')
  listKpiPeriods(@CurrentUser() user: AuthUser) {
    return this.service.listKpiPeriods(user.tenant_id as string);
  }

  @Post('kpi-periods')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  createKpiPeriod(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; startDate: string; endDate: string },
  ) {
    return this.service.createKpiPeriod(user.tenant_id as string, body);
  }

  // --- PERSONAL KPIs ---

  @Get('kpis')
  listKpis(
    @CurrentUser() user: AuthUser,
    @Query('employeeId') employeeId?: string,
    @Query('kpiPeriodId') kpiPeriodId?: string,
    @Query('status') status?: string,
    @Query('forReview') forReview?: string,
  ) {
    return this.service.listKpis(
      user.tenant_id as string,
      { email: user.email as string, roles: user.roles, permissions: user.permissions },
      { employeeId, kpiPeriodId, status, forReview: forReview === 'true' },
    );
  }

  @Post('kpis')
  createKpi(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      kpiPeriodId: string;
      title: string;
      description?: string;
      target: string;
      measurementMethod: string;
      weight: number;
      deadline: string;
    },
  ) {
    return this.service.createKpi(user.tenant_id as string, user.email as string, body);
  }

  @Patch('kpis/:id/submit')
  submitKpi(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.submitKpi(user.tenant_id as string, user.email as string, id);
  }

  @Patch('kpis/:id/progress')
  updateKpiProgress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    return this.service.updateKpiProgress(
      user.tenant_id as string,
      user.email as string,
      id,
      body.progress,
    );
  }

  @Patch('kpis/:id/decision')
  decideKpi(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; managerComment?: string },
  ) {
    return this.service.decideKpi(
      user.tenant_id as string,
      { email: user.email as string, roles: user.roles },
      id,
      body,
    );
  }

  // --- TEAM KPIs ---

  @Get('team-kpis/preview')
  previewTeamKpi(
    @CurrentUser() user: AuthUser,
    @Query('teamId') teamId: string,
    @Query('kpiPeriodId') kpiPeriodId: string,
  ) {
    return this.service.previewTeamKpi(user.tenant_id as string, user.email as string, teamId, kpiPeriodId);
  }

  @Get('team-kpis')
  listTeamKpis(
    @CurrentUser() user: AuthUser,
    @Query('kpiPeriodId') kpiPeriodId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listTeamKpis(
      user.tenant_id as string,
      { email: user.email as string, roles: user.roles },
      kpiPeriodId,
      status,
    );
  }

  @Post('team-kpis')
  submitTeamKpi(
    @CurrentUser() user: AuthUser,
    @Body() body: { teamId: string; kpiPeriodId: string; summary?: string },
  ) {
    return this.service.submitTeamKpi(user.tenant_id as string, user.email as string, body);
  }

  @Patch('team-kpis/:id/decision')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  decideTeamKpi(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; reviewComment?: string },
  ) {
    return this.service.decideTeamKpi(user.tenant_id as string, id, body);
  }
}
