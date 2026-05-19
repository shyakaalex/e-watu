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
  Max,
  Min,
} from 'class-validator';

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  PANEL = 'PANEL',
  TECHNICAL = 'TECHNICAL',
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
  locationOrLink?: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class CreateScorecardDto {
  @IsString()
  competency: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
