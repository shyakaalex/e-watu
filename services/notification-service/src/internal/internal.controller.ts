import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { InternalDispatchDto } from './dispatch.dto';
import { InternalApiGuard } from './internal-api.guard';

@Controller('internal')
@UseGuards(InternalApiGuard)
export class InternalController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('dispatch')
  dispatch(@Body() body: InternalDispatchDto) {
    return this.notifications.dispatch(body);
  }
}
