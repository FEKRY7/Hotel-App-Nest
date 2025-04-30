import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import {
  BathRoomType,
  BedType,
  ReservationStatusType,
  RoomType,
  SmokingPolicyType,
  ViewType,
} from 'src/untils/enums';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @IsOptional()
  floor?: number;

  @IsOptional()
  pricePerNight?: number;

  @IsOptional()
  discounts?: number;

  @IsOptional()
  availability?: string;

  @IsOptional()
  @IsDateString()
  checkInDate?: Date;

  @IsOptional()
  @IsDateString()
  checkOutDate?: Date;

  @IsOptional()
  @IsEnum(BedType)
  bedType?: BedType;

  @IsOptional()
  maxOccupancy?: number;

  @IsOptional()
  roomSize?: number;

  @IsOptional()
  @IsEnum(BathRoomType)
  bathroomType?: BathRoomType;

  @IsOptional()
  @IsEnum(ViewType)
  view?: ViewType;

  @IsOptional()
  @IsEnum(SmokingPolicyType)
  smokingPolicy?: SmokingPolicyType;

  @IsOptional()
  roomAmenities?: string;

  @IsOptional()
  @IsEnum(ReservationStatusType)
  reservationStatus?: ReservationStatusType;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
