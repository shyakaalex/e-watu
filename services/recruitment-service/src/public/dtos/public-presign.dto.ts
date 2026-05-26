import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min, MinLength, Matches } from 'class-validator';

export class PublicPresignDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^(?!\/)(?!.*\.\.)([a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/)
  objectKey!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contentType!: string;

  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024)
  fileSize!: number;
}
