import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  totalAmount: number;
}
