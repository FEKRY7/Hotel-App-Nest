import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RolesStaff } from 'src/Users/decorators/user-role.decorator';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTStaffType } from 'src/untils/types';
import { PaymentService } from './payment.service';
import { RoleTowType } from 'src/untils/enums';
import { AuthStaffGuard } from 'src/guards/auth.staff.guard';

@Controller('/api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // POST: /api/payment/checkout/:paymentMethodId/:bookingId
  @Post('checkout/:paymentMethodId/:bookingId')
  public async ProcessPayment(
    @Param('paymentMethodId') paymentMethodId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentService.processPayment(paymentMethodId, bookingId);
  }

  // POST: /api/payment/request-cancellation/:bookingId
  @Post('request-cancellation/:bookingId')
  public async RequestCancellation(@Param('bookingId') bookingId: string) {
    return this.paymentService.requestCancellation(bookingId);
  }

  // GET: /api/payment/owner/payments
  @Get('owner/payments')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetPayments(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.paymentService.getPayments(staffPelod, page, limit);
  }

  // GET: /api/payment/staff/payments
  @Get('staff/payments')
  @RolesStaff(RoleTowType.MANAGER, RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public async GetAllBookings(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.paymentService.getStaffPayments(staffPelod, page, limit);
  }

  // GET: /api/payment/totalAmount
  @Get('totalAmount')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetAnalyticsPayment() {
    return this.paymentService.getAnalyticsPayment();
  }
}
