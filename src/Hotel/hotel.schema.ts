import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type HotelDocument = Hotel & Document;

@Schema({ timestamps: true })
export class Hotel {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: [
      {
        secure_url: { type: String, default: 'default_profile_picture.png' },
        public_id: { type: String, default: '' },
      },
    ],
    default: [],
  })
  images: {
    secure_url: string;
    public_id: string;
  }[];

  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  rating: number;

  @Prop({ required: true })
  pricePerNight: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff' })
  managerId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Staff' }],
    required: true,
  })
  staffIds: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User'})
  createdBy: MongooseSchema.Types.ObjectId;

}

export const HotelSchema = SchemaFactory.createForClass(Hotel);
