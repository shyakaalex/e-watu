import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule, RequestLoggerMiddleware } from '@ewatu/common-auth';
import { HealthModule } from './health/health.module';
import { InternalModule } from './internal/internal.module';
import { MyModule } from './my/my.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotifyModule } from './notify/notify.module';
import { PublicModule } from './public/public.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonAuthModule,
    PrismaModule,
    NotifyModule,
    HealthModule,
    TenantModule,
    OnboardingModule,
    InternalModule,
    MyModule,
    PublicModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
