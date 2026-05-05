import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { MyController } from './my.controller';

@Module({
  imports: [TenantModule],
  controllers: [MyController],
})
export class MyModule {}
