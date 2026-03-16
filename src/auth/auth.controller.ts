//--------------------------------------------
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';

// --- DTOs (Data Transfer Objects) ---
export class RequestOtpDto {
@ApiProperty({
example: '+919876543210',
description: 'The phone number to send the OTP to'
})
phone: string;
}

export class VerifyOtpDto {
@ApiProperty({ example: '+919876543210' })
phone: string;

@ApiProperty({ example: '123456', description: 'The 6-digit code sent via SMS' })
token: string;
}
// ------------------------------------

@ApiTags('Auth')
@Controller('auth/otp')
export class AuthController {
constructor(private readonly authService: AuthService) {}

@Post('request')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Request an OTP for login' })
async requestOtp(@Body() body: RequestOtpDto) {
return this.authService.requestOtp(body.phone);
}

@Post('verify')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Verify the OTP and get a JWT access token' })
async verifyOtp(@Body() body: VerifyOtpDto) {
return this.authService.verifyOtp(body.phone, body.token);
}
}