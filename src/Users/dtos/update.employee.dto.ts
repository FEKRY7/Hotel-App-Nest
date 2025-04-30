import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { RoleTowType } from 'src/untils/enums';

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(RoleTowType)
  @IsOptional()
  role?: RoleTowType;
}
