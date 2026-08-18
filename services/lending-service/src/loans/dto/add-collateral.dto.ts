import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class AddCollateralDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  estimatedValue: number;
}
