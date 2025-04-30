import { IsString, IsNumber, IsArray, IsNotEmpty, Min, Max } from 'class-validator';

export class HotelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;


  @IsNotEmpty()
  rating: number;


  @IsNotEmpty()
  pricePerNight: number;

  @IsNotEmpty()
  amenities: string;
}
