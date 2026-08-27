import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, RolesGuard } from '@ewatu/common-auth';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('me')
  listMine(@CurrentUser() user: AuthUser) {
    return this.tasks.listMyTasks(user.tenant_id as string, user.email);
  }

  @Get('assigned-by-me')
  listAssignedByMe(@CurrentUser() user: AuthUser) {
    return this.tasks.listAssignedByMe(user.tenant_id as string, { email: user.email, roles: user.roles });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { employeeId: string; title: string; description?: string; dueDate?: string },
  ) {
    return this.tasks.createTask(
      user.tenant_id as string,
      { email: user.email, roles: user.roles, name: user.preferred_username ?? user.email ?? 'Someone' },
      body,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: 'PENDING' | 'IN_PROGRESS' | 'DONE' },
  ) {
    return this.tasks.updateTaskStatus(user.tenant_id as string, id, user.email, body.status);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasks.deleteTask(user.tenant_id as string, id, { email: user.email, roles: user.roles });
  }
}
