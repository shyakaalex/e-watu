import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsString } from 'class-validator';

export class CreateEmployeeFromPlacementDto extends CreateEmployeeDto {
  @IsOptional()
  @IsString()
  placementId?: string;

  @IsOptional()
  @IsString()
  override candidateId?: string;
}
