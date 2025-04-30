import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsPositive,
  Min,
} from 'class-validator';
import {
  BathRoomType,
  BedType,
  ReservationStatusType,
  RoomType,
  SmokingPolicyType,
  ViewType,
} from 'src/untils/enums';
import { Type } from 'class-transformer';

export class CreateRoomDto {

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsEnum(RoomType)
  roomType: RoomType;

 
  @IsNotEmpty()
  floor: number;

  @IsNotEmpty()
  pricePerNight: number;

  @IsNotEmpty()
  discounts: number;


  @IsNotEmpty()
  availability: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  checkInDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  checkOutDate?: Date;

  @IsEnum(BedType)
  bedType: BedType;

  @IsNotEmpty()
  maxOccupancy: number;

  @IsNotEmpty()
  roomSize: number;

  @IsEnum(BathRoomType)
  bathroomType: BathRoomType;

  @IsEnum(ViewType)
  view: ViewType;

  @IsEnum(SmokingPolicyType)
  smokingPolicy: SmokingPolicyType;

  @IsString()
  @IsNotEmpty()
  roomAmenities: string;

  @IsEnum(ReservationStatusType)
  @IsOptional()
  reservationStatus?: ReservationStatusType = ReservationStatusType.PENDING;

  @IsString()
  @IsNotEmpty()
  specialRequests: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
