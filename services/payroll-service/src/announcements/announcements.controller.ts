import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, RolesGuard } from '@ewatu/common-auth';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.announcements.listForCaller(user.tenant_id as string, user.email);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: { title: string; body: string; teamId?: string }) {
    return this.announcements.createAnnouncement(
      user.tenant_id as string,
      { email: user.email, roles: user.roles, name: user.preferred_username ?? user.email ?? 'Someone' },
      body,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.announcements.deleteAnnouncement(user.tenant_id as string, id, {
      email: user.email,
      roles: user.roles,
    });
  }
}
