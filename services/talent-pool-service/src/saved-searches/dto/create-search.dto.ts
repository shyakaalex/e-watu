import { IsObject, IsString, MaxLength } from 'class-validator';

export class CreateSearchDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsObject()
  filters!: Record<string, unknown>;
}
