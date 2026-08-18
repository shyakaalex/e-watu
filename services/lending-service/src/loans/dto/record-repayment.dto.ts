import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsISO8601 } from 'class-validator';

export class RecordRepaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsISO8601()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;
}
