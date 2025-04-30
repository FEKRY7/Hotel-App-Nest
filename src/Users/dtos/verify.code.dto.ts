import { IsNotEmpty } from 'class-validator';

export class VerifyCodeDto {
    @IsNotEmpty()
    UserResetCode: string; 
}

