import { ContractType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateContractDto {
  @IsEnum(ContractType)
  contractType!: ContractType;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
