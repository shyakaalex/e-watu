import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL',
}

export class CreateInterviewDto {
  @IsUUID()
  applicationId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  durationMin?: number;

  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  interviewerIds?: string[];

  @IsOptional()
  @IsString()
  feedback?: string;
}
