import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule, HttpModule.register({ timeout: 15_000 })],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
