import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class LoginStaffDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(5)
  @IsNotEmpty()
  password: string;
}
