import { SetMetadata } from "@nestjs/common";
import { RoleTowType, RoleType } from "src/untils/enums";

// Roles decorator
export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);

export const RolesStaff = (...roles: RoleTowType[]) => SetMetadata('roles', roles);

