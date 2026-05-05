import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { InternalController } from './internal.controller';
import { InternalApiGuard } from './internal-api.guard';

@Module({
  imports: [TenantModule],
  controllers: [InternalController],
  providers: [InternalApiGuard],
})
export class InternalModule {}
