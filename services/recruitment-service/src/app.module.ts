import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule } from '@ewatu/common-auth';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ApplicationsModule } from './applications/applications.module';
import { InterviewsModule } from './interviews/interviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonAuthModule,
    PrismaModule,
    HealthModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    InterviewsModule,
  ],
})
export class AppModule {}
