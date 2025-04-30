import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Room, RoomSchema } from './room.schema';
import { CloudinaryModule } from 'src/Cloudinary/cloudinary.module';
import { Hotel, HotelSchema } from 'src/Hotel/hotel.schema';

@Module({
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
  imports: [
    MongooseModule.forFeature([
        { name: Room.name, schema: RoomSchema },
        { name: Hotel.name, schema: HotelSchema },
    ]),
    UsersModule,
    JwtModule,
    CloudinaryModule,
  ],
})
export class RoomsModule {}
