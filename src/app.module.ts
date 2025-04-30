import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './Users/users.module';
import { TokenModule } from './Token/token.module';
import { CloudinaryModule } from './Cloudinary/cloudinary.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HotelsModule } from './Hotel/hotel.module';
import { RoomsModule } from './Room/room.module';
import { BookingModule } from './Booking/booking.module';
import { PaymentsModule } from './Payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensure it's available globally
      envFilePath: '.env.development', // Specify the correct path to your environment file
    }), 
    MongooseModule.forRoot(process.env.MONGO_URL),
    TokenModule,
    UsersModule,
    HotelsModule,
    RoomsModule,
    BookingModule,
    PaymentsModule,
    CloudinaryModule,
  ],
})
export class AppModule {}