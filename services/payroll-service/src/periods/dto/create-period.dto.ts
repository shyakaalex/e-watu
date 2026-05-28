import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  clientId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @Type(() => Number)
  @IsInt()
  periodYear!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
