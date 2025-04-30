import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { RoleTowType } from 'src/untils/enums';
import { Exclude } from 'class-transformer';

export type StaffDocument = Staff & Document;

@Schema({ timestamps: true })
export class Staff {

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hotel', required: true })
  @Exclude()
  hotelId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, minlength: 3, maxlength: 20 })
  name: string;
 
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  @Exclude()
  password: string;

  @Prop({ required: true, enum: RoleTowType })
  role: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({ type: Date, default: null })
  passwordChangedAt?: Date;

  @Prop()
  staffResetCode?: string;

  @Prop({ type: Date, default: null })
  staffResetExpire?: Date;

  @Prop()
  passwordResetCode?: string;

  @Prop({ type: Date, default: null })
  passwordResetExpire?: Date;

  @Prop({ default: false })
  passwordResetVerified?: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);