import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentStatusType, StatusType } from 'src/untils/enums';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
  room: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hotel', required: true })
  hotel: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  checkInDate: Date;

  @Prop({ type: Date, required: true })
  checkOutDate: Date;

  @Prop({ type: Number, required: true })
  numberOfDays: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ 
    type: { 
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 }
    },
    required: true
  })
  guests: { adults: number; children?: number };

  @Prop({ type: String, enum: StatusType, default: StatusType.PENDING })
  status: string;

  @Prop({ type: String, enum: PaymentStatusType, default: PaymentStatusType.PENDING })
  paymentStatus: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
