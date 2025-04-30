import { 
    IsEmail,  
    IsNotEmpty, 
    IsString, 
    Length, 
    MinLength, 
    MaxLength,
    IsOptional, 
} from 'class-validator';

import { Match } from '../decorators/match.decorator'; // Custom validator

export class RegisterDto {
    
    @IsString()
    @Length(2, 20)
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @MaxLength(250)
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(5)
    @IsNotEmpty()
    password: string;

    @IsString()
    @MinLength(5)
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;

    @IsString()
    @Length(8, 15)
    @IsOptional()
    phone?: string;
}
