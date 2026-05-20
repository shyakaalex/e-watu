import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule, RequestLoggerMiddleware } from '@ewatu/common-auth';
import { HealthController } from './health.controller';
import { PresignModule } from './presign/presign.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CommonAuthModule, PresignModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
