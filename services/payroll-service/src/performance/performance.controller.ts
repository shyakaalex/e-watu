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
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
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
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
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
    return this.service.listGoals(user.tenant_id as string, employeeId, appraisalCycleId);
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
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
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
    return this.service.listAppraisals(user.tenant_id as string, employeeId, managerId);
  }

  @Get('appraisals/:id')
  getAppraisal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getAppraisal(user.tenant_id as string, id);
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
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
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
    return this.service.listFeedbackRequests(user.tenant_id as string, reviewerId, employeeId);
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
}
