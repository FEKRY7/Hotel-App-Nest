import { IsEnum, IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ReservationStatusType } from 'src/untils/enums';

export class RoomToolsDto {
  @IsEnum(ReservationStatusType)
  @IsOptional()
  status?: ReservationStatusType = ReservationStatusType.PENDING;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  discounts?: number;

  @IsOptional()
  amenities?: string;
}
