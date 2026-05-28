import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonAuthModule, RequestLoggerMiddleware } from '@ewatu/common-auth';
import { ScheduleModule } from '@nestjs/schedule';
import { ContractsModule } from './contracts/contracts.module';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { PayslipModule } from './payslip/payslip.module';
import { PayrollConfigModule } from './payroll-config/payroll-config.module';
import { PeriodsModule } from './periods/periods.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CommonAuthModule,
    PrismaModule,
    HealthModule,
    PayrollConfigModule,
    EmployeesModule,
    ContractsModule,
    PeriodsModule,
    ReportsModule,
    PayslipModule,
    JobsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
