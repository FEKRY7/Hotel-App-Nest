import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JWTPayloadType, JWTStaffType } from '../untils/types';
import { AuthProvider } from './auth.provider';
import { ChangePasswordDto } from './dtos/change.password.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { MailService } from '../mail/mail.service';
import { ResetDto } from './dtos/reset.dto';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Token, TokenDocument } from '../Token/token.schema';
import { Hotel, HotelDocument } from '../Hotel/hotel.schema';
import { RoleTowType } from '../untils/enums';
import { CloudinaryService } from '../Cloudinary/cloudinary.service';
import { VerifyUserDto } from './dtos/verify.user.dto';
import { VerifyCodeDto } from './dtos/verify.code.dto';
import { VerifyCodePasswordDto } from './dtos/verify.code.password.dto';
import { Staff, StaffDocument } from './staff.schema';
import { UpdateNameDto } from './dtos/update.name.dto';
import { CreateStaffDto } from './dtos/employee.dto';
import { Schema as MongooseSchema } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UpdateStaffDto } from './dtos/update.employee.dto';
import { UpdateStaffRoleDto } from './dtos/update.role.dto';
import { LoginStaffDto } from './dtos/login.staff.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    private readonly authProvider: AuthProvider,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param registerDto The user's registration data.
   * @returns JWT (access token)
   */

  public async SignUp(registerDto: RegisterDto) {
    return await this.authProvider.SignUp(registerDto);
  }

  /**
   * Log In user
   * @param loginDto The user's login data.
   * @returns JWT (access token)
   */

  public async login(loginDto: LoginDto) {
    return await this.authProvider.login(loginDto);
  }

  public async verifyUser(verifyUserDto: VerifyUserDto) {
    return await this.authProvider.verifyUser(verifyUserDto);
  }

  public async verifyCode(verifyCodeDto: VerifyCodeDto) {
    return await this.authProvider.verifyCode(verifyCodeDto);
  }

  public async forgetPassword(forgotDto: ForgotDto) {
    return await this.authProvider.forgetPassword(forgotDto);
  }

  public async verifyCodePassword(
    verifyCodePasswordDto: VerifyCodePasswordDto,
  ) {
    return await this.authProvider.verifyCodePassword(verifyCodePasswordDto);
  }

  public async Resetpassword(resetDto: ResetDto) {
    return await this.authProvider.Resetpassword(resetDto);
  }

  public async getCurrentUser(id: string) {
    return await this.authProvider.getCurrentUser(id);
  }

  public async getToken(token: string) {
    const tokenDb = await this.tokenModel
      .findOne({
        token,
        isValied: true,
      })
      .lean()
      .exec();
    if (!tokenDb) {
      throw new NotFoundException('Expired or invalid token');
    }
  }

  public async getStaffUser(id: string) {
    const staff = await this.staffModel
      .findById(id)
      .select('-password -createdAt -updatedAt -__v -_id')
      .populate({
        path: 'hotelId',
        select: 'name -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      })
      .exec();

    if (!staff) {
      throw new NotFoundException(`No staff found for ID: ${id}`);
    }

    return staff;
  }

  public async uploadImageProfile(
    payload: JWTPayloadType,
    profilePicture: Express.Multer.File,
  ) {
    if (!profilePicture) {
      throw new BadRequestException('Profile image file is required');
    }

    const uploadResult = await this.cloudinaryService.uploadProfilePicture(
      payload,
      profilePicture,
    );

    if (!uploadResult?.secure_url || !uploadResult?.public_id) {
      throw new InternalServerErrorException(
        'Failed to upload profile image to Cloudinary',
      );
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      payload._id,
      {
        profilePicture: {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Profile image updated successfully' };
  }

  public async updateName(
    payload: JWTPayloadType,
    updateNameDto: UpdateNameDto,
  ) {
    const { name } = updateNameDto;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      payload._id,
      { name },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Name updated successfully' };
  }

  public async deleteMe(payload: JWTPayloadType) {
    const user = await this.userModel.findByIdAndDelete(payload._id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete profile picture from Cloudinary if exists
    const publicId = user.profilePicture?.public_id;
    if (publicId) {
      try {
        await this.cloudinaryService.destroyImage(publicId);
      } catch (error) {
        // Optional: log or handle silently if needed
        console.error('Failed to delete image from Cloudinary:', error.message);
      }
    }
  }

  public async getEmployees(page: number, limit: number) {
    const staffStartIndex = (page - 1) * limit;
    const userStartIndex = (page - 1) * limit;

    const [totalStaffs, totalUsers] = await Promise.all([
      this.staffModel.countDocuments(),
      this.userModel.countDocuments(),
    ]);

    const [staffs, customers] = await Promise.all([
      this.staffModel
        .find({})
        .select('-password -createdAt -updatedAt -__v -_id')
        .skip(staffStartIndex)
        .limit(limit),
      this.userModel
        .find({})
        .select('-password -createdAt -updatedAt -__v -_id')
        .skip(userStartIndex)
        .limit(limit),
    ]);

    return {
      message: 'Users fetched successfully',
      Staff: staffs,
      Customers: customers,
      totalUsers: totalUsers + totalStaffs,
      currentPage: page,
      pageSize: limit,
    };
  }

  public async getEmployees_Manager(staffPelod: JWTStaffType) {
    const managerId = staffPelod._id;
    const manager = await this.staffModel.findById(managerId).select('name');
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const hotel = await this.hotelModel.findOne({ managerId }).populate({
      path: 'staffsIds',
      select: 'name role -_id',
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return {
      message: `Staff IDs Under Manager: ${manager.name}`,
      staff: hotel.staffIds || [],
    };
  }

  public async createEmployee(hotelId: string, createStaffDto: CreateStaffDto) {
    const { name, email, password, role } = createStaffDto;

    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const hashedPassword = await this.authProvider.hashPassword(password);

    const staff = new this.staffModel({
      name,
      email,
      password: hashedPassword,
      role,
      hotelId: new Types.ObjectId(hotelId),
    });

    await staff.save();

    const staffId = staff._id as MongooseSchema.Types.ObjectId;

    if (role === RoleTowType.MANAGER) {
      hotel.managerId = staffId;
    } else {
      hotel.staffIds = [...(hotel.staffIds || []), staffId];
    }
    await hotel.save();

    return {
      message: 'Staff created successfully',
      staffId,
    };
  }

  public async updateEmployee(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.staffModel.findByIdAndUpdate(id, updateStaffDto, {
      new: true,
    });

    if (!staff) {
      throw new NotFoundException(`User not found for ID: ${id}`);
    }

    return {
      message: 'User updated successfully',
    };
  }

  public async UpdateRoleById(id: string, updateStaffRoleDto: UpdateStaffRoleDto) {
    const staff = await this.staffModel.findById(id);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
  
    staff.role = updateStaffRoleDto.role;
    await staff.save();
  
    return {
      message: 'Role updated successfully',
      data: staff,
    };
  }

  public async deleteEmployee(staffPelod: JWTStaffType) {
    const staff = await this.staffModel.findByIdAndDelete(staffPelod._id);

    if (!staff) {
      throw new NotFoundException(`User not found for ID: ${staffPelod._id}`);
    }

    return { message: 'User deleted successfully' };
  }

  public async ChanagePassword(changePasswordDto: ChangePasswordDto) {
    const { email, oldPassword, newPassword, ConfirmNewPassword } =
      changePasswordDto;
    const staff = await this.staffModel.findOne({ email });
    if (!staff) {
      throw new NotFoundException('There is no user with email ' + email);
    }

    const isMatch = await bcrypt.compare(oldPassword, staff.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const isSameAsOldPassword = await bcrypt.compare(
      newPassword,
      staff.password,
    );
    if (isSameAsOldPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password',
      );
    }

    // Validate that newPassword and ConfirmNewPassword match
    if (newPassword !== ConfirmNewPassword) {
      throw new NotFoundException('New password and confirmation do not match');
    }

    staff.password = await this.authProvider.hashPassword(newPassword);

    await staff.save();

    const staffPelod: JWTStaffType = {
      _id: staff._id.toString(),
      role: staff.role,
    };
    const token = await this.generateJWT(staffPelod);

    try {
      await this.mailService.sendChanagePasswordEmail(email);
    } catch (error) {
      console.error('Error sending email:', error);
    }

    return { message: 'Password changed successfully', token: `Bearer ${token}` };
  }

  public async LoginStaff(loginStaffDto: LoginStaffDto) {
    const { email, password } = loginStaffDto;
    const staff = await this.staffModel.findOne({ email });
    if (!staff) throw new NotFoundException('Email is incorrect');

    // Validate password
    const isValidPassword = await bcrypt.compare(password, staff.password);
    if (!isValidPassword) throw new NotFoundException('Password is wrong');

    const staffPelod: JWTStaffType = {
      _id: staff._id.toString(),
      role: staff.role,
    };
    const token = await this.generateJWT(staffPelod);

    await this.tokenModel.create({ token, staff: staff._id });

    try {
      await this.mailService.sendLoginStaffEmail(email);
    } catch (error) {
      console.error('Error sending email:', error);
    }

    return { message: staff, token: `Bearer ${token}` };
  }

  public generateJWT(staffPelod: JWTStaffType) {
    return this.jwtService.signAsync(staffPelod, {
      expiresIn: '2h', // Set the token expiration time to 2 hours
    });
  }
}
