import { IsNotEmpty, IsOptional, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class InternalPresignDownloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  key!: string;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(3600)
  expiresIn?: number;
}
