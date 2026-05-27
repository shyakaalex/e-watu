import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonAuthModule, RequestLoggerMiddleware } from '@ewatu/common-auth';
import { AuthModule } from './auth/auth.module';
import { ApiThrottlerGuard } from './common/api-throttler.guard';
import { HealthController } from './health/health.controller';
import { InternalModule } from './internal/internal.module';
import { MeController } from './me/me.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 15 * 60 * 1000,
        limit: 5,
      },
    ]),
    PrismaModule,
    AuthModule,
    InternalModule,
    UsersModule,
    CommonAuthModule,
  ],
  controllers: [HealthController, MeController],
  providers: [{ provide: APP_GUARD, useClass: ApiThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
