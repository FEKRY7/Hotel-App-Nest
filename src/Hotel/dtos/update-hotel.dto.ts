import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class UpdateHotelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  rating?: number;

  @IsOptional()
  pricePerNight?: number;

  @IsString()
  @IsOptional()
  amenities?: string;
}
