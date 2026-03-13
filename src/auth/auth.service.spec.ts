import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
let service: AuthService;
let prisma: PrismaService;

// 1.fake versions of our database and JWT generator created.
const mockPrismaService = {
user: {
findUnique: jest.fn(),
create: jest.fn(),
},
};

const mockJwtService = {
sign: jest.fn(() => 'fake-jwt-token'),
};

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
providers: [
AuthService,
{ provide: PrismaService, useValue: mockPrismaService },
{ provide: JwtService, useValue: mockJwtService },
],
}).compile();

service = module.get<AuthService>(AuthService);
prisma = module.get<PrismaService>(PrismaService);
});

it('should throw an error for an invalid OTP', async () => {
// Expect service throw an Unauthexp if the token is wrong
await expect(service.verifyOtp('+919876543210', '000000')).rejects.toThrow(UnauthorizedException);
});

it('should successfully verify the master OTP and return a token', async () => {
// Fake database returning a user
mockPrismaService.user.findUnique.mockResolvedValue({
id: 'user-123',
phone: '+919876543210',
displayName: 'Test User',
hasCompletedOnboarding: false,
});

const result = await service.verifyOtp('+919876543210', '123456');

expect(result).toHaveProperty('access_token', 'fake-jwt-token');
expect(result.user).toHaveProperty('phone', '+919876543210');
});
});