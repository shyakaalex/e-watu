import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { LeaveService } from './leave.service';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('leave-types')
  getLeaveTypes(@CurrentUser() user: AuthUser) {
    return this.leaveService.getLeaveTypes(user.tenant_id as string);
  }

  @Get('leave-balances')
  getLeaveBalances(
    @CurrentUser() user: AuthUser,
    @Query('employeeId') employeeId: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.leaveService.getLeaveBalances(
      user.tenant_id as string,
      employeeId,
      targetYear,
    );
  }

  @Get('leave-requests')
  getLeaveRequests(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.leaveService.getLeaveRequests(user.tenant_id as string, status);
  }

  @Post('leave-requests')
  createLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      days?: number;
      reason?: string;
    },
  ) {
    return this.leaveService.createLeaveRequest(user.tenant_id as string, body);
  }

  @Post('leave-requests/:id/approve')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  approveLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.leaveService.approveLeaveRequest(
      user.tenant_id as string,
      id,
      user.sub, // The approver user ID
      body.note,
    );
  }

  @Post('leave-requests/:id/reject')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  rejectLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.leaveService.rejectLeaveRequest(
      user.tenant_id as string,
      id,
      user.sub,
      body.note,
    );
  }
}
