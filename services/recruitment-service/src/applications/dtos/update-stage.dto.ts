import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApplicationStage {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export class UpdateStageDto {
  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  notes?: string;
}
