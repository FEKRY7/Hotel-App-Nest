import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  BathRoomType,
  BedType,
  ReservationStatusType,
  RoomType,
  SmokingPolicyType,
  ViewType,
} from 'src/untils/enums';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  roomNumber: string;

  @Prop({ type: String, enum: RoomType, required: true })
  roomType: string;
 
  @Prop({ required: true })
  floor: number;

  @Prop({ required: true })
  pricePerNight: number;

  @Prop({ default: 0 })
  discounts: number;

  @Prop({ default: true })
  availability: boolean;

  @Prop()
  checkInDate?: Date;

  @Prop()
  checkOutDate?: Date;

  @Prop({ type: String, enum: BedType, required: true })
  bedType: string;

  @Prop({ required: true })
  maxOccupancy: number;

  @Prop({ required: true })
  roomSize: number;

  @Prop({ type: String, enum: BathRoomType, required: true })
  bathroomType: string;

  @Prop({ type: String, enum: ViewType, required: true })
  view: string;

  @Prop({ type: String, enum: SmokingPolicyType, required: true })
  smokingPolicy: string;

  @Prop({ type: [String], default: [] })
  roomAmenities: string[];

  @Prop({
    type: String,
    enum: ReservationStatusType,
    default: ReservationStatusType.PENDING,
  })
  reservationStatus: string;

  @Prop({ default: null })
  specialRequests?: string;

  @Prop({
    type: [
      {
        secure_url: { type: String, default: 'default_profile_picture.png' },
        public_id: { type: String, default: '' },
      },
    ],
    default: [],
  })
  roomImages: {
    secure_url: string;
    public_id: string;
  }[];

  @Prop({ required: true })
  description: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
