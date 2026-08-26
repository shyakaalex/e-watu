import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './payslip.service';

@Module({
  imports: [EmployeesModule],
  controllers: [PayslipController],
  providers: [PayslipService],
  exports: [PayslipService],
})
export class PayslipModule {}
