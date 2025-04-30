import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Booking, BookingSchema } from 'src/Booking/booking.schema';
import { Hotel, HotelSchema } from 'src/Hotel/hotel.schema';
import { StripeModule } from 'nestjs-stripe';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/Users/user.schema';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    JwtModule,
    MailModule,
    ConfigModule,
    StripeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get<string>('STRIPE_SECRET_KEY'),
      }),
    }),
  ],
})
export class PaymentsModule {}
