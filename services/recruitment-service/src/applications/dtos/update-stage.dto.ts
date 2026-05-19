import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApplicationStage {
  APPLIED = 'APPLIED',
  SCREENED = 'SCREENED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEWED = 'INTERVIEWED',
  OFFERED = 'OFFERED',
  PLACED = 'PLACED',
  REJECTED = 'REJECTED',
}

export class UpdateStageDto {
  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
