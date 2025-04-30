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
import { RoleType } from 'src/untils/enums';
import { JWTPayloadType } from 'src/untils/types';
import { UsersService } from 'src/Users/users.service';

@Injectable()
export class AuthUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: RoleType[] = this.reflector.getAllAndOverride<RoleType[]>(
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
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.getCurrentUser(payload._id);

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (user.passwordChangedAt) {
        const passChangedTimestamp = Math.floor(
          user.passwordChangedAt.getTime() / 1000,
        );
        if (passChangedTimestamp > payload.iat) {
          throw new ForbiddenException(
            'Your password has been changed, please login again',
          );
        }
      }

      // Optional: check token exists in DB if using token storage
      await this.usersService.getToken(token);

      if (!roles.includes(user.role as RoleType)) {
        throw new ForbiddenException('Access denied: Insufficient role');
      }

      request[CURRENT_USER_KEY] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error?.message || 'Invalid or expired token',
      );
    }
  }
}
