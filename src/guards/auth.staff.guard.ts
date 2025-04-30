import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CURRENT_USER_KEY } from 'src/untils/constants';
import { RoleTowType } from 'src/untils/enums';
import { UsersService } from 'src/Users/users.service';

@Injectable()
export class AuthStaffGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: RoleTowType[] = this.reflector.getAllAndOverride<RoleTowType[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!roles || roles.length === 0) {
      throw new ForbiddenException('Access denied: No roles specified.');
    }

    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('You are not logged in');
    }

    try {
      const payloadStaff = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const staff = await this.usersService.getStaffUser(payloadStaff._id);

      if (!staff) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (staff.passwordChangedAt) {
        const passChangedTimestamp = Math.floor(
          staff.passwordChangedAt.getTime() / 1000,
        );
        if (passChangedTimestamp > payloadStaff.iat) {
          throw new ForbiddenException(
            'Your password has been changed, please login again',
          );
        }
      }

      // Optional: check token exists in DB if using token storage
      await this.usersService.getToken(token);

      if (!roles.includes(staff.role as RoleTowType)) {
        throw new ForbiddenException('Access denied: Insufficient role');
      }

      request[CURRENT_USER_KEY] = payloadStaff;
      return true;
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException(
        error?.message || 'Invalid or expired token',
      );
    }
  }
}
