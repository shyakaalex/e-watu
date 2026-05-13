import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  candidateId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
