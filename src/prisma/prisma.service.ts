import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
constructor() {
// 1. Create a raw Postgres connection pool using your .env URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap the pool in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
super({ adapter });
}

async onModuleInit() {
await this.$connect();
console.log('Database connected successfully via pg adapter!');
}
}