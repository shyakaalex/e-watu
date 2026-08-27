import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HrDashboardController } from './hr-dashboard.controller';
import { HrDashboardService } from './hr-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [HrDashboardController],
  providers: [HrDashboardService],
})
export class HrDashboardModule {}
