import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { TrainingService } from './training.service';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get('courses')
  listCourses(@CurrentUser() user: AuthUser) {
    return this.service.listCourses(user.tenant_id as string);
  }

  @Post('courses')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  createCourse(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; description?: string; mandatory?: boolean; dueDate?: string },
  ) {
    return this.service.createCourse(user.tenant_id as string, body);
  }

  @Delete('courses/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  deleteCourse(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteCourse(user.tenant_id as string, id);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMyRecords(user.tenant_id as string, user.email);
  }

  @Patch('me/:recordId')
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param('recordId') recordId: string,
    @Body() body: { status: 'IN_PROGRESS' | 'COMPLETED' },
  ) {
    return this.service.updateMyRecord(user.tenant_id as string, user.email, recordId, body.status);
  }
}
