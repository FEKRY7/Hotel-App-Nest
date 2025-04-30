import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayloadType } from 'src/untils/types';
import { MailService } from '../mail/mail.service';
import * as CryptoJS from 'crypto-js';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Token, TokenDocument } from '../Token/token.schema';
import { Model, Types } from 'mongoose';
import { VerifyUserDto } from './dtos/verify.user.dto';
import { VerifyCodeDto } from './dtos/verify.code.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { VerifyCodePasswordDto } from './dtos/verify.code.password.dto';
import { ResetDto } from './dtos/reset.dto';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param registerDto The user's registration data.
   * @returns JWT (access token)
   */

  public async SignUp(registerDto: RegisterDto) {
    const { name, email, password, phone } = registerDto;

    const isEmailExist = await this.userModel.findOne({ email }).lean().exec();
    if (isEmailExist) {
      throw new ConflictException(
        'Email already exists, please choose another one.',
      );
    }

    if (!process.env.CRYPTOKEY) {
      throw new InternalServerErrorException('Encryption key is missing.');
    }

    const hashedPassword = await this.hashPassword(password);

    const encryptedPhone = CryptoJS.AES.encrypt(
      phone,
      process.env.CRYPTOKEY,
    ).toString();

    let emailSentMessage = 'There was an issue sending the email';
    try {
      await this.mailService.sendOtpEmailTemplate(email, name);
      emailSentMessage = 'email sent successfully';
    } catch (error) {
      console.error('Error sending email:', error);
    }

    try {
      const newUser = new this.userModel({
        name,
        email,
        password: hashedPassword,
        phone: encryptedPhone,
      });

      await newUser.save();

      return {
        message: 'User successfully registered',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone, // Encrypted phone is okay
        },
        emailSent: emailSentMessage,
      };
    } catch (error) {
      console.error('Error saving user:', error);
      throw new InternalServerErrorException(
        'Registration failed, please try again.',
      );
    }
  }

  /**
   * Log In user
   * @param loginDto The user's login data.
   * @returns JWT (access token)
   */

  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email is incorrect');

    if (!user.isVerified) {
      throw new NotFoundException('User not verified');
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new NotFoundException('Password is wrong');

    // Generate JWT token
    const payload: JWTPayloadType = {
      _id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    const token = await this.generateJWT(payload);

    // Store token in DB
    await this.tokenModel.create({ token, user: user._id });

    return { message: 'Sign-in successful', token: `Bearer ${token}` };
  }

  public async verifyUser(verifyUserDto: VerifyUserDto) {
    const { email } = verifyUserDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(`User not found for email: ${email}`);
    }

    const generatedCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedResetCode = CryptoJS.SHA256(generatedCode).toString();

    user.UserResetCode = hashedResetCode;
    user.UserResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    try {
      await this.mailService.sendVerificationMessage(
        email,
        user.name,
        generatedCode,
      );
      return { message: 'Verification code sent successfully' };
    } catch (error) {
      user.UserResetCode = undefined;
      user.UserResetExpire = undefined;
      await user.save();

      console.error('Failed to send email:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again.',
      );
    }
  }

  public async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const { UserResetCode } = verifyCodeDto;

    const hashedResetCode = CryptoJS.SHA256(UserResetCode).toString();

    const user = await this.userModel.findOne({
      UserResetCode: hashedResetCode,
    });

    if (!user) {
      throw new NotFoundException('Invalid verification code');
    }

    if (
      !user.UserResetExpire ||
      new Date(user.UserResetExpire).getTime() < Date.now()
    ) {
      throw new BadRequestException('Verification code has expired');
    }

    user.isVerified = true;
    user.UserResetCode = undefined;
    user.UserResetExpire = undefined;

    await user.save();

    return { message: 'Verification code verified successfully' };
  }

  public async forgetPassword(forgotDto: ForgotDto) {
    const { email } = forgotDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException(`User not found for email: ${email}`);
    }

    const generatedCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedResetCode = CryptoJS.SHA256(generatedCode).toString();

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpiret = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetVerifed = false;

    await user.save();

    try {
      await this.mailService.sendForgetPasswordEmail(
        email,
        user.name,
        generatedCode,
      );
      return { message: 'Password Code sent successfully' };
    } catch (error) {
      (user.passwordResetCode = undefined),
        (user.passwordResetExpiret = undefined),
        (user.passwordResetVerifed = undefined),
        await user.save();
      throw new InternalServerErrorException(
        'Failed to send password reset email. Please try again.',
      );
    }
  }

  public async verifyCodePassword(
    verifyCodePasswordDto: VerifyCodePasswordDto,
  ) {
    const { passwordResetCode } = verifyCodePasswordDto;
  
    const hashResertCode = CryptoJS.SHA256(passwordResetCode).toString();
  
    const user = await this.userModel.findOne({
      passwordResetCode: hashResertCode,
      passwordResetExpiret: { $gt: new Date() }, 
    });
  
    if (!user) {
      throw new NotFoundException('Invalid or expired reset password code');
    }
  
    user.passwordResetVerifed = true;
    await user.save();
  
    return {
      message: 'Password reset code verified successfully',
    };
  }
  

  public async Resetpassword(resetDto: ResetDto) {
    const { email, newPassword, confirmNewPassword } = resetDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('There is no user with email ' + email);
    }

    // Validate password confirmation
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    if (!user.passwordResetVerifed) {
      throw new NotFoundException('Invalid or expired reset password code');
    }

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpiret = undefined;
    user.passwordResetVerifed = undefined;
    await user.save();

    // Generate JWT token
    const payload: JWTPayloadType = {
      _id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    const token = await this.generateJWT(payload);

    return {
      message: 'Password has been reset successfully',
      token,
    };
  }

  public async getCurrentUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid User ID format');
    }

    const user = await this.userModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException(
        'No userProfile found or userProfile still pending',
      );
    }

    return user;
  }

  /**
   *  Hashes the password.
   * @param password  The password to hash.
   * @returns  Hashed password.
   */
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   *  Generates JWT token from payload.
   * @param payload  The user's payload.  This should contain the user's id and user type.  For example: { id: 1, userType: 'admin' }.  The JWT library automatically generates
   * @returns  JWT token.
   */
  public generateJWT(payload: JWTPayloadType) {
    return this.jwtService.signAsync(payload, {
      expiresIn: '2h', // Set the token expiration time to 2 hours
    });
  }
}
