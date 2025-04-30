import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './payment.schema';
import { Booking, BookingDocument } from 'src/Booking/booking.schema';
import { Hotel, HotelDocument } from 'src/Hotel/hotel.schema';
import Stripe from 'stripe';
import { User, UserDocument } from 'src/Users/user.schema';
import {
  PaymentMethodType,
  PaymentStatusType,
  RoleTowType,
  StatusTowType,
  StatusType,
} from 'src/untils/enums';
import { MailService } from 'src/mail/mail.service';
import { JWTStaffType } from 'src/untils/types';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  public async processPayment(paymentMethodId: string, bookingId: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('user');
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const user = await this.userModel.findById(booking.user);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let emailSentMessage = '';

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: booking.totalPrice * 100, // Stripe expects amount in cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
      });

      const payment = await this.paymentModel.create({
        hotel: booking.hotel,
        room: booking.room,
        booking: booking._id,
        paymentMethod: PaymentMethodType.ONLINE,
        amount: booking.totalPrice * 100,
        transactionId: paymentIntent.id,
        paymentDate: new Date(),
        status:
          paymentIntent.status === StatusTowType.SUCCEEDED
            ? StatusTowType.COMPLETED
            : StatusTowType.FAILED,
      });

      if (paymentIntent.status === StatusTowType.SUCCEEDED) {
        booking.paymentStatus = PaymentStatusType.PAID;
        user.payments.push(payment._id);

        try {
          await this.mailService.sendPaymentConfirmationMessage(
            user.name,
            user.email,
            booking._id.toString(),
            booking.checkInDate.toISOString(),
            booking.checkOutDate.toISOString(),
            booking.room.toString(),
            booking.totalPrice,
          );
          emailSentMessage = 'Email sent successfully';
        } catch (error) {
          console.error('Error sending email:', error);
          emailSentMessage = 'Failed to send email';
        }

        await booking.save();
        await user.save();

        return {
          success: true,
          message: 'Payment successful',
          payment,
          emailStatus: emailSentMessage,
        };
      } else {
        booking.paymentStatus = PaymentStatusType.FAILED;
        await booking.save();
        throw new ForbiddenException(
          'Payment failed. Please try again or use another payment method.',
        );
      }
    } catch (error) {
      if (error.type === 'StripeCardError') {
        throw new ForbiddenException('Payment failed: ' + error.message);
      }
      throw new ForbiddenException(
        'Payment processing error: ' + error.message,
      );
    }
  }

  public async requestCancellation(bookingId: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if ((booking.paymentStatus = PaymentStatusType.PAID)) {
      throw new ForbiddenException(
        'Cannot cancel a paid booking. Please contact support.',
      );
    }

    booking.status = StatusType.CANCELLED;
    await booking.save();

    return { message: 'Cancellation request submitted successfully' };
  }

  public async getPayments(
    staffPayload: JWTStaffType,
    page: number = 1,
    limit: number = 10,
  ) {
    const { _id: staffId, role: staffRole } = staffPayload;

    if (staffRole !== RoleTowType.OWNER) {
      throw new ForbiddenException('Unauthorized role');
    }

    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find()
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalPayments = await this.paymentModel.countDocuments();

    if (!payments.length) {
      throw new NotFoundException('No payments found');
    }

    return {
      success: true,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: page,
      totalPayments,
      payments,
    };
  }

  public async getStaffPayments(
    staffPayload: JWTStaffType,
    page: number = 1,
    limit: number = 10,
  ) {
    const { _id: staffId, role: staffRole } = staffPayload;

    const hotelQuery =
      staffRole === RoleTowType.MANAGER
        ? { managerId: staffId }
        : { staffsIds: { $in: [staffId] } };

    const hotel = await this.hotelModel.findOne(hotelQuery);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find({ hotel: hotel._id })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalPayments = await this.paymentModel.countDocuments({
      hotel: hotel._id,
    });

    if (payments.length === 0) {
      throw new NotFoundException('No payments found');
    }

    return {
      success: true,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: page,
      totalPayments,
      payments,
    };
  }

  public async getAnalyticsPayment() {
    const result = await this.paymentModel.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
  
    const totalAmount = result?.[0]?.totalAmount || 0;
  
    return { totalAmount };
  }
  
}
