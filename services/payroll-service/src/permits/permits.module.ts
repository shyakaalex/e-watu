import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PermitsController } from './permits.controller';
import { PermitsService } from './permits.service';

@Module({
  imports: [PrismaModule],
  controllers: [PermitsController],
  providers: [PermitsService],
  exports: [PermitsService],
})
export class PermitsModule {}
