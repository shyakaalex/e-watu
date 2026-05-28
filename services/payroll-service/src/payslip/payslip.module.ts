import { Module } from '@nestjs/common';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './payslip.service';

@Module({
  controllers: [PayslipController],
  providers: [PayslipService],
  exports: [PayslipService],
})
export class PayslipModule {}
