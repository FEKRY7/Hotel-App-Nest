import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesStaff } from 'src/Users/decorators/user-role.decorator';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTPayloadType, JWTStaffType } from 'src/untils/types';
import { BookingService } from './booking.service';
import { AuthStaffGuard } from 'src/guards/auth.staff.guard';
import { RoleTowType, RoleType } from 'src/untils/enums';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { AuthUserGuard } from 'src/guards/auth.user.guard';

@Controller('/api/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // POST: /api/booking/create/:roomId
  @Post('create/:roomId')
  @Roles(RoleType.CUSTOMER)
  @UseGuards(AuthUserGuard)
  public async createBooking(
    @Param('roomId') roomId: string,
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.bookingService.addBooking(roomId, createBookingDto, payload);
  }

  // PUT: /api/booking/cancel/:id
  @Put('cancel/:id')
  public CancelBooking(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }

  // GET: /api/booking
  @Get()
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public async GetBookings(@CurrentUser() staffPelod: JWTStaffType) {
    return this.bookingService.getBookings(staffPelod);
  }

  // GET: /api/booking/owner/all
  @Get('owner/all')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetAllBookings(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.bookingService.getAllBookings(page, limit);
  }

  // GET: /api/booking/:id
  @Get('/:id')
  @RolesStaff(RoleTowType.OWNER, RoleTowType.MANAGER, RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public async GetBookingById(
    @Param('id') id: string,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.bookingService.getBookingById(id, staffPelod);
  }
}