import { Module } from '@nestjs/common';
import { OutsourcingController } from './outsourcing.controller';
import { OutsourcingService } from './outsourcing.service';

@Module({
  controllers: [OutsourcingController],
  providers: [OutsourcingService],
})
export class OutsourcingModule {}
