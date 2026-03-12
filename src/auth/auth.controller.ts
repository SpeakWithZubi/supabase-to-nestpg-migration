import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth/otp')
export class AuthController {
    
    constructor(private readonly authService: AuthService) {}

    @Post('request')
    @HttpCode(HttpStatus.OK)
    async requestOtp(@Body() body: { phone: string }) {
    return this.authService.requestOtp(body.phone);
    }

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() body: { phone: string; token: string }) {
    return this.authService.verifyOtp(body.phone, body.token);
    }
}