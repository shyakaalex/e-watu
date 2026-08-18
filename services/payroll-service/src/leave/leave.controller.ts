import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
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
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('managerId') managerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.leaveService.getLeaveRequests(user.tenant_id as string, {
      status,
      employeeId,
      department,
      leaveTypeId,
      managerId,
      startDate,
      endDate,
      search,
    });
  }

  @Post('leave-requests')
  createLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      days?: number;
      reason?: string;
      attachmentS3Key?: string;
      delegateToEmployeeId?: string;
      emergencyContactPhone?: string;
    },
  ) {
    return this.leaveService.createLeaveRequest(user.tenant_id as string, body, {
      userId: user.sub,
      ip: req.ip,
    });
  }

  @Post('leave-requests/:id/attachment')
  uploadAttachment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { contentType: string; fileSize: number },
  ) {
    return this.leaveService.uploadLeaveAttachment(
      user.tenant_id as string,
      id,
      body.contentType,
      body.fileSize,
    );
  }

  @Post('leave-requests/:id/approve')
  approveLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.leaveService.approveLeaveRequest(
      user.tenant_id as string,
      id,
      { userId: user.sub, roles: user.roles, email: user.email, ip: req.ip },
      body.note,
    );
  }

  @Post('leave-requests/:id/reject')
  rejectLeaveRequest(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.leaveService.rejectLeaveRequest(
      user.tenant_id as string,
      id,
      { userId: user.sub, roles: user.roles, email: user.email, ip: req.ip },
      body.note,
    );
  }

  @Post('leave-requests/:id/request-info')
  requestMoreInfo(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    return this.leaveService.requestMoreInfo(
      user.tenant_id as string,
      id,
      { userId: user.sub, roles: user.roles, email: user.email, ip: req.ip },
      body.note,
    );
  }
}
