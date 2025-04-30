import { IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { RoleTowType } from 'src/untils/enums';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;


  @IsEnum(RoleTowType)
  @IsNotEmpty()
  role: RoleTowType;
}

