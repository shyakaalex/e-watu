import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule } from '@ewatu/common-auth';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { InternalModule } from './internal/internal.module';
import { MeController } from './me/me.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    InternalModule,
    CommonAuthModule,
  ],
  controllers: [HealthController, MeController],
})
export class AppModule {}
