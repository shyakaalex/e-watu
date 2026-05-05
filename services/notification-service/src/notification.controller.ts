import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';

@Controller('notifications')
export class NotificationController {
  @Get('health')
  health() {
    return {
      service: 'notification-service',
      status: 'ok',
      note: 'Email/SMS wiring comes next (EWatu §5.3)',
    };
  }

  /** Placeholder: accept a notification request; real delivery will use a queue + templates. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN, EwatuRole.TENANT_ADMIN)
  @Post('dispatch')
  dispatch(
    @CurrentUser() user: AuthUser,
    @Body() body: { channel: 'email' | 'in_app'; template: string; payload?: Record<string, unknown> },
  ) {
    return {
      accepted: true,
      by: user.sub,
      channel: body.channel,
      template: body.template,
      message: 'Queued (stub — no email sent yet)',
    };
  }
}
