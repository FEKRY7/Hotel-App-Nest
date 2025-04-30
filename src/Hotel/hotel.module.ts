import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HotelController } from './hotel.controller';
import { HotelService } from './hotel.service';
import { Hotel, HotelSchema } from './hotel.schema';
import { CloudinaryModule } from 'src/Cloudinary/cloudinary.module';


@Module({
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
  imports: [
   MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
    ]),
    UsersModule,
    JwtModule,
    CloudinaryModule,
  ],
})
export class HotelsModule {}
