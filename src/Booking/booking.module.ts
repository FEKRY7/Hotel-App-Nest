import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './booking.schema';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Room, RoomSchema } from 'src/Room/room.schema';
import { MailModule } from 'src/mail/mail.module';
import { Hotel, HotelSchema } from 'src/Hotel/hotel.schema';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
  imports: [
   MongooseModule.forFeature([
    { name: Booking.name, schema: BookingSchema },
    { name: Room.name, schema: RoomSchema },
    { name: Hotel.name, schema: HotelSchema },
    ]),
    UsersModule,
    JwtModule,
    MailModule,
  ],
})
export class BookingModule {}
