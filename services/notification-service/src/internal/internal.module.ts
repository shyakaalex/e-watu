import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [InternalController],
})
export class InternalModule {}
