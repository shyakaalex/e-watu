import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, IsIn, IsOptional, Max } from 'class-validator';

export class CreateLoanDto {
  @IsString()
  @IsNotEmpty()
  borrowerId: string;

  @IsNumber()
  @IsPositive()
  principalAmount: number;

  @IsNumber()
  @Max(100)
  interestRate: number;

  @IsIn(['FLAT', 'REDUCING_BALANCE'])
  interestType: 'FLAT' | 'REDUCING_BALANCE';

  @IsInt()
  @IsPositive()
  termMonths: number;

  @IsString()
  @IsOptional()
  purpose?: string;
}
