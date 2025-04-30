import {
  IsOptional,
  IsString,
  Length,
} from 'class-validator';


export class UpdateNameDto {
  @IsString()
  @Length(2, 20)
  @IsOptional()
  name?: string;
}