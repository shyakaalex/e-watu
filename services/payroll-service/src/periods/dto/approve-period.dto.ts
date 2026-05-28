import { IsOptional, IsString } from 'class-validator';

export class ApprovePeriodDto {
  @IsOptional()
  @IsString()
  comments?: string;
}
