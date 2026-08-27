import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrievancesController } from './grievances.controller';
import { GrievancesService } from './grievances.service';

@Module({
  imports: [PrismaModule],
  controllers: [GrievancesController],
  providers: [GrievancesService],
})
export class GrievancesModule {}
