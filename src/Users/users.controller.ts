import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JWTPayloadType, JWTStaffType } from 'src/untils/types';
import { ChangePasswordDto } from './dtos/change.password.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { ResetDto } from './dtos/reset.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerifyUserDto } from './dtos/verify.user.dto';
import { VerifyCodePasswordDto } from './dtos/verify.code.password.dto';
import { AuthStaffGuard } from 'src/guards/auth.staff.guard';
import { Roles, RolesStaff } from './decorators/user-role.decorator';
import { RoleTowType, RoleType } from 'src/untils/enums';
import { AuthUserGuard } from 'src/guards/auth.user.guard';
import { UpdateNameDto } from './dtos/update.name.dto';
import { CreateStaffDto } from './dtos/employee.dto';
import { UpdateStaffDto } from './dtos/update.employee.dto';
import { UpdateStaffRoleDto } from './dtos/update.role.dto';
import { LoginStaffDto } from './dtos/login.staff.dto';
import { VerifyCodeDto } from './dtos/verify.code.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST: /api/users/auth/signup
  @Post('auth/signup')
  public async registerUser(@Body() Body: RegisterDto) {
    return await this.usersService.SignUp(Body);
  }

  // POST: /api/users/auth/login
  @Post('auth/login')
  public async login(@Body() Body: LoginDto) {
    return await this.usersService.login(Body);
  }

  // POST: /api/users/auth/verify
  @Post('auth/verify')
  public async VerifyUser(@Body() verifyUserDto: VerifyUserDto) {
    return this.usersService.verifyUser(verifyUserDto);
  }

  // POST: /api/users/auth/verify/code
  @Post('verify/code')
  public async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.usersService.verifyCode(verifyCodeDto);
  }

  // POST: /api/users/auth/forgot-password
  @Post('auth/forgot-password')
  public async ForgetPassword(@Body() forgotDto: ForgotDto) {
    return this.usersService.forgetPassword(forgotDto);
  }

  // POST: /api/users/auth/verify-otp
  @Post('auth/verify-otp')
  public async VerifyCodePassword(
    @Body() verifyCodePasswordDto: VerifyCodePasswordDto,
  ) {
    return this.usersService.verifyCodePassword(verifyCodePasswordDto);
  }

  // POST: /api/users/auth/reset
  @Post('auth/reset')
  public async Resetpassword(@Body() resetDto: ResetDto) {
    return this.usersService.Resetpassword(resetDto);
  }

  // GET: /api/users/current-user
  @Get('current-user')
  @Roles(RoleType.CUSTOMER)
  @UseGuards(AuthUserGuard)
  public async GetLogginUserProfile(@CurrentUser() payload: JWTPayloadType) {
    return await this.usersService.getCurrentUser(payload._id);
  }

  // GET: /api/users/staff/profile
  @Get('/staff/profile')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetStaffUser(@CurrentUser() staffPelod: JWTStaffType) {
    return await this.usersService.getStaffUser(staffPelod._id);
  }

  // POST: /api/users/profile/upload-image
  @Post('/profile/upload-image')
  @Roles(RoleType.CUSTOMER)
  @UseGuards(AuthUserGuard)
  @UseInterceptors(FileInterceptor('profile-image'))
  public async UploadImageProfile(
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFile() profilePicture: Express.Multer.File,
  ) {
    return await this.usersService.uploadImageProfile(payload, profilePicture);
  }

  // PUT: /api/users/profile/update-name
  @Put('/profile/update-name')
  @Roles(RoleType.CUSTOMER)
  @UseGuards(AuthUserGuard)
  public async UpdateName(
    @CurrentUser() payload: JWTPayloadType,
    @Body() updateNameDto: UpdateNameDto,
  ) {
    return await this.usersService.updateName(payload, updateNameDto);
  }

  // DELETE: /api/users/profile/delete
  @Delete('/profile/delete')
  @Roles(RoleType.CUSTOMER)
  @UseGuards(AuthUserGuard)
  public async DeleteMe(@CurrentUser() payload: JWTPayloadType) {
    return await this.usersService.deleteMe(payload);
  }

  // GET: /api/users/owner/all-users
  @Get('/owner/all-users')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async getEmployees(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    return await this.usersService.getEmployees(pageNumber, limitNumber);
  }

  // GET: /api/users/manager/all-users
  @Get('/manager/all-users')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetEmployees_Manager(@CurrentUser() staffPelod: JWTStaffType) {
    return await this.usersService.getEmployees_Manager(staffPelod);
  }

  // POST: /api/users/admin/create-user/:hotelId
  @Post('/admin/create-user/:hotelId')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async CreateEmployee(
    @Param('hotelId') hotelId: string,
    @Body() createStaffDto: CreateStaffDto,
  ) {
    return await this.usersService.createEmployee(hotelId, createStaffDto);
  }

  // PUT: /api/users/admin/:id
  @Put('/admin/:id')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async UpdateEmployee(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return await this.usersService.updateEmployee(id, updateStaffDto);
  }

  // PUT: /api/users/admin/update-role/:id
  @Put('/admin/update-role/:id')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async UpdateRoleById(
    @Param('id') id: string,
    @Body() updateStaffRoleDto: UpdateStaffRoleDto,
  ) {
    return await this.usersService.UpdateRoleById(id, updateStaffRoleDto);
  } 

  // DELETE: /api/users/admin
  @Delete('/admin')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async DeleteEmployee(@CurrentUser() staffPelod: JWTStaffType) {
    return await this.usersService.deleteEmployee(staffPelod);
  }

  // PUT: /api/users/admin/change-password
  @Put('/admin/change-password')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async ChanagePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.usersService.ChanagePassword(changePasswordDto);
  }
  
  // POST: /api/users/staff/login
  @Post('/staff/login')
  public async LoginStaff(@Body() loginStaffDto: LoginStaffDto) {
    return await this.usersService.LoginStaff(loginStaffDto);
  } 
}
