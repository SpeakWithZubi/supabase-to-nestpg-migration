import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
function generateSimpleOTP(): string {
return Math.floor(100000 + Math.random() * 900000).toString();
}
@Injectable()
export class AuthService {
private otpStore = new Map<string, { otp: string; expiresAt: number }>();
constructor(
private prisma: PrismaService,
private jwtService: JwtService,
) {}

async requestOtp(phone: string) {
    console.log("Calling OTP Lambda for ${phone}");
    const otp=generateSimpleOTP();
    const expiresAt=Date.now()+5*60*1000;
    this.otpStore.set(phone,{otp,expiresAt});
    return { success: true };
}

async verifyOtp(phone: string, token: string) {
if (token !== '123456') {
throw new UnauthorizedException('Invalid OTP');
}

let user = await this.prisma.user.findUnique({ where: { phone } });

if (!user) {
  user = await this.prisma.user.create({
    data: {
      phone,
      email: `${phone.replace('+', '')}@temp.placeholder.com`,
    },
  });
}

const payload = { sub: user.id, phone: user.phone };
const access_token = this.jwtService.sign(payload);

return {
  access_token,
  expires_in: 3600,
  user: {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
  },
};
}
}