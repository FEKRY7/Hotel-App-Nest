import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleType } from 'src/untils/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, minlength: 3, maxlength: 20 })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ enum: RoleType, default: RoleType.CUSTOMER })
  role: string;

  @Prop()
  phone?: string;

  @Prop({
    type: {
      secure_url: { type: String, default: 'default_profile_picture.png' },
      public_id: { type: String, default: '' },
    },
  })
  profilePicture: {
    secure_url: string;
    public_id: string;
  };

  @Prop({ type: Array, default: [] })
  payments: any[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  UserResetCode?: string;

  @Prop()
  UserResetExpire?: Date;

  @Prop()
  passwordResetCode?: string;

  @Prop()
  passwordResetExpiret?: Date;

  @Prop()
  passwordResetVerifed?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
