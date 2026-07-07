import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- APPRAISAL CYCLES ---

  async listCycles(tenantId: string) {
    return this.prisma.appraisalCycle.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createCycle(
    tenantId: string,
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
    const cycle = await this.prisma.appraisalCycle.create({
      data: {
        tenantId,
        clientId: body.clientId,
        name: body.name,
        frequency: body.frequency,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        selfAssessmentDeadline: new Date(body.selfAssessmentDeadline),
        managerReviewDeadline: new Date(body.managerReviewDeadline),
        hrValidationDeadline: new Date(body.hrValidationDeadline),
        status: 'DRAFT',
      },
    });

    return cycle;
  }

  async updateCycleStatus(tenantId: string, id: string, status: 'DRAFT' | 'ACTIVE' | 'COMPLETED') {
    const cycle = await this.prisma.appraisalCycle.findUnique({ where: { id } });
    if (!cycle || cycle.tenantId !== tenantId) {
      throw new NotFoundException('Appraisal cycle not found');
    }

    // When a cycle becomes ACTIVE, auto-create appraisals for all active employees of this tenant
    if (status === 'ACTIVE') {
      const activeEmployees = await this.prisma.employee.findMany({
        where: {
          tenantId,
          employmentStatus: 'ACTIVE',
          ...(cycle.clientId ? { clientId: cycle.clientId } : {}),
        },
      });

      for (const employee of activeEmployees) {
        const exists = await this.prisma.appraisal.findUnique({
          where: {
            employeeId_cycleId: { employeeId: employee.id, cycleId: cycle.id },
          },
        });
        if (!exists) {
          await this.prisma.appraisal.create({
            data: {
              tenantId,
              employeeId: employee.id,
              cycleId: cycle.id,
              status: 'SELF_ASSESSMENT',
            },
          });
        }
      }
    }

    return this.prisma.appraisalCycle.update({
      where: { id },
      data: { status },
    });
  }

  // --- GOAL SETTING & KPI MANAGEMENT ---

  async listGoals(tenantId: string, employeeId?: string, appraisalCycleId?: string) {
    return this.prisma.goal.findMany({
      where: {
        tenantId,
        ...(employeeId ? { employeeId } : {}),
        ...(appraisalCycleId ? { appraisalCycleId } : {}),
      },
      include: {
        employee: true,
        cycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(
    tenantId: string,
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
    // Check if appraisal exists for this cycle/employee, if not, create it
    const exists = await this.prisma.appraisal.findUnique({
      where: {
        employeeId_cycleId: { employeeId: body.employeeId, cycleId: body.appraisalCycleId },
      },
    });
    if (!exists) {
      await this.prisma.appraisal.create({
        data: {
          tenantId,
          employeeId: body.employeeId,
          cycleId: body.appraisalCycleId,
          status: 'SELF_ASSESSMENT',
        },
      });
    }

    return this.prisma.goal.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        appraisalCycleId: body.appraisalCycleId,
        title: body.title,
        description: body.description,
        target: body.target,
        measurementMethod: body.measurementMethod,
        weight: body.weight,
        deadline: new Date(body.deadline),
        status: 'DRAFT',
      },
    });
  }

  async updateGoal(
    tenantId: string,
    id: string,
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
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.tenantId !== tenantId) {
      throw new NotFoundException('Goal not found');
    }

    const updateData: any = { ...body };
    if (body.deadline) updateData.deadline = new Date(body.deadline);

    return this.prisma.goal.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteGoal(tenantId: string, id: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.tenantId !== tenantId) {
      throw new NotFoundException('Goal not found');
    }
    return this.prisma.goal.delete({ where: { id } });
  }

  // --- GOAL TEMPLATE LIBRARY ---

  async ensureDefaultGoalTemplates(tenantId: string) {
    const defaults = [
      { title: 'Exceed Recruitment Timelines', target: 'Fill job orders in < 30 days', method: 'Average time-to-hire report', weight: 25 },
      { title: 'Maintain System Integrity', target: 'Ensure 100% data compliance for onboarding', method: 'HR audits', weight: 20 },
      { title: 'Improve Customer Satisfaction', target: 'Attain a client rating above 4.5/5', method: 'Quarterly surveys', weight: 15 },
      { title: 'Promote Talent Pool Growth', target: 'Add 200 qualified candidates to the pool', method: 'Talent Pool database query', weight: 20 },
    ];

    for (const d of defaults) {
      const exists = await this.prisma.goalTemplate.findFirst({
        where: { tenantId, title: d.title },
      });
      if (!exists) {
        await this.prisma.goalTemplate.create({
          data: {
            tenantId,
            title: d.title,
            target: d.target,
            measurementMethod: d.method,
            weight: d.weight,
          },
        });
      }
    }
  }

  async listGoalTemplates(tenantId: string) {
    await this.ensureDefaultGoalTemplates(tenantId);
    return this.prisma.goalTemplate.findMany({ where: { tenantId } });
  }

  async createGoalTemplate(tenantId: string, body: { title: string; target: string; measurementMethod: string; weight: number; roleType?: string }) {
    return this.prisma.goalTemplate.create({
      data: {
        tenantId,
        title: body.title,
        target: body.target,
        measurementMethod: body.measurementMethod,
        weight: body.weight,
        roleType: body.roleType,
      },
    });
  }

  // --- COMPETENCY FRAMEWORKS ---

  async ensureDefaultCompetencies(tenantId: string) {
    let framework = await this.prisma.competencyFramework.findFirst({
      where: { tenantId },
    });
    if (!framework) {
      framework = await this.prisma.competencyFramework.create({
        data: {
          tenantId,
          name: 'Core Core Competencies',
          description: 'Default competency framework for all staff',
        },
      });

      const coreCompetencies = [
        { name: 'Technical Ability', description: 'Subject matter expertise and quality of technical output', weight: 1.0 },
        { name: 'Communication', description: 'Expresses ideas clearly and keeps stakeholders informed', weight: 1.0 },
        { name: 'Collaboration & Teamwork', description: 'Works effectively across teams and helps others', weight: 1.0 },
        { name: 'Problem Solving', description: 'Analyzes challenges and identifies effective solutions', weight: 1.0 },
        { name: 'Delivery & Execution', description: 'Consistently meets commitments and deliverables', weight: 1.0 },
      ];

      for (const cc of coreCompetencies) {
        await this.prisma.competency.create({
          data: {
            frameworkId: framework.id,
            name: cc.name,
            description: cc.description,
            weight: cc.weight,
          },
        });
      }
    }
    return framework;
  }

  async getCompetencyFramework(tenantId: string) {
    const fw = await this.ensureDefaultCompetencies(tenantId);
    return this.prisma.competencyFramework.findUnique({
      where: { id: fw.id },
      include: { competencies: true },
    });
  }

  // --- APPRAISALS & REVIEWS ---

  async listAppraisals(tenantId: string, employeeId?: string, managerId?: string) {
    return this.prisma.appraisal.findMany({
      where: {
        tenantId,
        ...(employeeId ? { employeeId } : {}),
        ...(managerId ? { employee: { managerId } } : {}),
      },
      include: {
        employee: true,
        cycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAppraisal(tenantId: string, id: string) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            manager: true,
          },
        },
        cycle: true,
        goalRatings: {
          include: {
            goal: true,
          },
        },
        competencyRatings: {
          include: {
            competency: true,
          },
        },
        feedbackRequests: {
          include: {
            reviewer: true,
            response: true,
          },
        },
      },
    });

    if (!appraisal || appraisal.tenantId !== tenantId) {
      throw new NotFoundException('Appraisal not found');
    }

    return appraisal;
  }

  async submitSelfAssessment(
    tenantId: string,
    id: string,
    body: {
      selfComment?: string;
      goalRatings: Array<{ goalId: string; rating: number; comment?: string }>;
      competencyRatings: Array<{ competencyId: string; rating: number; comment?: string }>;
    },
  ) {
    const appraisal = await this.prisma.appraisal.findUnique({ where: { id } });
    if (!appraisal || appraisal.tenantId !== tenantId) {
      throw new NotFoundException('Appraisal not found');
    }

    // Save Goal Self Ratings
    for (const gr of body.goalRatings) {
      await this.prisma.appraisalGoalRating.upsert({
        where: { appraisalId_goalId: { appraisalId: id, goalId: gr.goalId } },
        create: {
          appraisalId: id,
          goalId: gr.goalId,
          selfRating: gr.rating,
          selfComment: gr.comment,
        },
        update: {
          selfRating: gr.rating,
          selfComment: gr.comment,
        },
      });
    }

    // Save Competency Self Ratings
    for (const cr of body.competencyRatings) {
      await this.prisma.appraisalCompetencyRating.upsert({
        where: { appraisalId_competencyId: { appraisalId: id, competencyId: cr.competencyId } },
        create: {
          appraisalId: id,
          competencyId: cr.competencyId,
          selfRating: cr.rating,
          selfComment: cr.comment,
        },
        update: {
          selfRating: cr.rating,
          selfComment: cr.comment,
        },
      });
    }

    // Compute simple self score
    const selfGoalAvg = body.goalRatings.length > 0
      ? body.goalRatings.reduce((sum, g) => sum + g.rating, 0) / body.goalRatings.length
      : 3.0;

    const selfCompAvg = body.competencyRatings.length > 0
      ? body.competencyRatings.reduce((sum, c) => sum + c.rating, 0) / body.competencyRatings.length
      : 3.0;

    const selfScore = (selfGoalAvg * 0.6) + (selfCompAvg * 0.4);

    return this.prisma.appraisal.update({
      where: { id },
      data: {
        selfComment: body.selfComment,
        selfScore,
        status: 'MANAGER_REVIEW',
      },
    });
  }

  async submitManagerReview(
    tenantId: string,
    id: string,
    body: {
      managerComment?: string;
      managerAdjustment?: number;
      goalRatings: Array<{ goalId: string; rating: number; comment?: string }>;
      competencyRatings: Array<{ competencyId: string; rating: number; comment?: string }>;
    },
  ) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: {
        goalRatings: true,
      },
    });
    if (!appraisal || appraisal.tenantId !== tenantId) {
      throw new NotFoundException('Appraisal not found');
    }

    // Save Goal Manager Ratings
    for (const gr of body.goalRatings) {
      await this.prisma.appraisalGoalRating.upsert({
        where: { appraisalId_goalId: { appraisalId: id, goalId: gr.goalId } },
        create: {
          appraisalId: id,
          goalId: gr.goalId,
          managerRating: gr.rating,
          managerComment: gr.comment,
        },
        update: {
          managerRating: gr.rating,
          managerComment: gr.comment,
        },
      });
    }

    // Save Competency Manager Ratings
    for (const cr of body.competencyRatings) {
      await this.prisma.appraisalCompetencyRating.upsert({
        where: { appraisalId_competencyId: { appraisalId: id, competencyId: cr.competencyId } },
        create: {
          appraisalId: id,
          competencyId: cr.competencyId,
          managerRating: cr.rating,
          managerComment: cr.comment,
        },
        update: {
          managerRating: cr.rating,
          managerComment: cr.comment,
        },
      });
    }

    // Calculations:
    // 1. Goal weighted rating
    let totalGoalWeight = 0;
    let sumGoalWeightedScore = 0;

    for (const gr of body.goalRatings) {
      const dbGoal = await this.prisma.goal.findUnique({ where: { id: gr.goalId } });
      if (dbGoal) {
        const weight = Number(dbGoal.weight);
        totalGoalWeight += weight;
        sumGoalWeightedScore += gr.rating * weight;
      }
    }

    const goalScore = totalGoalWeight > 0 ? sumGoalWeightedScore / totalGoalWeight : 3.0;

    // 2. Competency average rating
    const competencyScore = body.competencyRatings.length > 0
      ? body.competencyRatings.reduce((sum, c) => sum + c.rating, 0) / body.competencyRatings.length
      : 3.0;

    // 3. Final calculation: (Goal Score * 0.6) + (Competency Score * 0.4) + Manager Adjustment
    const adj = body.managerAdjustment ?? 0;
    const managerScore = (goalScore * 0.6) + (competencyScore * 0.4);
    const finalScore = managerScore + adj;

    return this.prisma.appraisal.update({
      where: { id },
      data: {
        managerComment: body.managerComment,
        managerAdjustment: adj,
        managerScore,
        finalScore,
        status: 'HR_REVIEW',
      },
    });
  }

  async submitHRValidation(tenantId: string, id: string, body: { hrComment?: string; hrScore?: number }) {
    const appraisal = await this.prisma.appraisal.findUnique({ where: { id } });
    if (!appraisal || appraisal.tenantId !== tenantId) {
      throw new NotFoundException('Appraisal not found');
    }

    const finalVal = body.hrScore ?? Number(appraisal.finalScore ?? 3.0);

    return this.prisma.appraisal.update({
      where: { id },
      data: {
        hrComment: body.hrComment,
        hrScore: body.hrScore,
        finalScore: finalVal,
        status: 'COMPLETED',
      },
    });
  }

  // --- 360-DEGREE FEEDBACK ---

  async listFeedbackRequests(tenantId: string, reviewerId?: string, employeeId?: string) {
    return this.prisma.feedbackRequest.findMany({
      where: {
        tenantId,
        ...(reviewerId ? { reviewerId } : {}),
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: true,
        reviewer: true,
        response: true,
        appraisal: {
          include: {
            cycle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFeedbackRequest(
    tenantId: string,
    body: {
      appraisalId: string;
      employeeId: string;
      reviewerId: string;
      relationship: 'PEER' | 'SUBORDINATE' | 'MANAGER';
    },
  ) {
    const exists = await this.prisma.feedbackRequest.findFirst({
      where: {
        appraisalId: body.appraisalId,
        reviewerId: body.reviewerId,
      },
    });
    if (exists) {
      throw new BadRequestException('Feedback request already exists for this reviewer');
    }

    return this.prisma.feedbackRequest.create({
      data: {
        tenantId,
        appraisalId: body.appraisalId,
        employeeId: body.employeeId,
        reviewerId: body.reviewerId,
        relationship: body.relationship,
        status: 'PENDING',
      },
    });
  }

  async submitFeedbackResponse(
    tenantId: string,
    requestId: string,
    body: {
      anonymized?: boolean;
      competencyRatings: Record<string, { rating: number; comment?: string }>;
      generalComment?: string;
    },
  ) {
    const request = await this.prisma.feedbackRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Feedback request not found');
    }

    const response = await this.prisma.feedbackResponse.upsert({
      where: { feedbackRequestId: requestId },
      create: {
        feedbackRequestId: requestId,
        anonymized: body.anonymized ?? true,
        competencyRatings: body.competencyRatings,
        generalComment: body.generalComment,
      },
      update: {
        anonymized: body.anonymized ?? true,
        competencyRatings: body.competencyRatings,
        generalComment: body.generalComment,
      },
    });

    await this.prisma.feedbackRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' },
    });

    return response;
  }
}
