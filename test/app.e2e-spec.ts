import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
let app: INestApplication;

beforeAll(async () => {
// Spin up the entire Nest app just like it runs in production
const moduleFixture: TestingModule = await Test.createTestingModule({
imports: [AppModule],
}).compile();

app = moduleFixture.createNestApplication();
await app.init();
});

afterAll(async () => {
await app.close();
});

it('/auth/otp/request (POST) - should return success', () => {
return request(app.getHttpServer())
.post('/auth/otp/request')
.send({ phone: '+919876543211' })
.expect(200)
.expect((res) => {
expect(res.body.success).toBe(true);
});
});

it('/auth/otp/verify (POST) - should return JWT with master token', () => {
return request(app.getHttpServer())
.post('/auth/otp/verify')
.send({ phone: '+919876543211', token: '123456' })
.expect(200)
.expect((res) => {
expect(res.body).toHaveProperty('access_token');
expect(res.body.user).toHaveProperty('phone', '+919876543211');
});
});
});