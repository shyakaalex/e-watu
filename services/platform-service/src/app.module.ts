import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule } from '@ewatu/common-auth';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { MyModule } from './my/my.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonAuthModule,
    PrismaModule,
    HealthModule,
    TenantModule,
    OnboardingModule,
    InternalModule,
    MyModule,
  ],
})
export class AppModule {}
