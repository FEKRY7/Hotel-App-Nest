import { IsNotEmpty } from 'class-validator';

export class VerifyCodePasswordDto {
    @IsNotEmpty()
    passwordResetCode: string; 
}

