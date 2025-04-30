import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
