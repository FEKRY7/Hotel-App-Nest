import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMethodType, StatusTowType } from 'src/untils/enums';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hotel', required: true })
  hotel: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
  room: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', required: true })
  booking: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: PaymentMethodType, required: true })
  paymentMethod: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Date, default: Date.now, required: true })
  paymentDate: Date;

  @Prop({ type: String, enum: StatusTowType, required: true })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
