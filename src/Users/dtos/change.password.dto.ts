import { IsNotEmpty, IsString, MaxLength, IsEmail } from 'class-validator';

export class ChangePasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MaxLength(7)
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @MaxLength(7)
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @MaxLength(7)
  @IsNotEmpty()
  ConfirmNewPassword: string;
}
