import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { PublicController } from './public.controller';

@Module({
  imports: [TenantModule],
  controllers: [PublicController],
})
export class PublicModule {}
