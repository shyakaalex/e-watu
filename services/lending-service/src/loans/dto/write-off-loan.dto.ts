import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class WriteOffLoanDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
