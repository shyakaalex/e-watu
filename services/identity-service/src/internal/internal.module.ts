import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InternalController } from './internal.controller';
import { InternalApiGuard } from './internal-api.guard';

@Module({
  imports: [AuthModule],
  controllers: [InternalController],
  providers: [InternalApiGuard],
})
export class InternalModule {}
