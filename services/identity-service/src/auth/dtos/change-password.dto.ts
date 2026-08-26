import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(128)
  newPassword!: string;
}
