import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatusType, StatusType } from 'src/untils/enums';

class GuestsDto {
  @IsNumber()
  @Min(1)
  adults: number;

  @IsNumber()
  children?: number;
}

export class CreateBookingDto {

  @IsDateString()
  checkInDate: Date;

  @IsDateString() 
  checkOutDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => GuestsDto)
  guests: GuestsDto;

  @IsEnum(StatusType)
  status: StatusType = StatusType.PENDING;

  @IsNumber()
  @Min(1)
  numberOfDays: number;

  @IsEnum(PaymentStatusType)
  paymentStatus: PaymentStatusType = PaymentStatusType.PENDING;
}
