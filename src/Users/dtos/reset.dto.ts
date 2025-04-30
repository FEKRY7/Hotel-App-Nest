import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetDto {

  @IsEmail()
  @MaxLength(250)
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(32)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(32)
  confirmNewPassword: string;
}
