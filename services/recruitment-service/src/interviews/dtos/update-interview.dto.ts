import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateInterviewDto } from './create-interview.dto';

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum InterviewOutcome {
  ADVANCE = 'ADVANCE',
  HOLD = 'HOLD',
  SECOND_ROUND = 'SECOND_ROUND',
  OFFER = 'OFFER',
  REJECT = 'REJECT',
}

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsEnum(InterviewOutcome)
  outcome?: InterviewOutcome;
}
