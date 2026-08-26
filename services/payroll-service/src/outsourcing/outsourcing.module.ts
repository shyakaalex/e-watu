import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { OutsourcingController } from './outsourcing.controller';
import { OutsourcingService } from './outsourcing.service';

@Module({
  imports: [EmployeesModule],
  controllers: [OutsourcingController],
  providers: [OutsourcingService],
})
export class OutsourcingModule {}
