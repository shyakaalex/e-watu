import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule } from '@ewatu/common-auth';
import { NotificationController } from './notification.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CommonAuthModule],
  controllers: [NotificationController],
})
export class AppModule {}
