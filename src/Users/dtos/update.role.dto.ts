import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleTowType } from 'src/untils/enums';

export class UpdateStaffRoleDto {
  @IsEnum(RoleTowType)
  @IsNotEmpty()
  role: RoleTowType;
}