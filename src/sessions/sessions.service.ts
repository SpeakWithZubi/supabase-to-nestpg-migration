import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
constructor(private prisma: PrismaService) {}

async findAll(userId: string) {
return this.prisma.session.findMany({ where: { userId } });
}

async findOne(userId: string, id: string) {
const session = await this.prisma.session.findUnique({ where: { id } });
if (!session) throw new NotFoundException('Session not found');
if (session.userId !== userId) throw new ForbiddenException('Access denied to this session');
return session;
}

async create(userId: string, data: any) {
return this.prisma.session.create({
data: { ...data, userId },
});
}

async update(userId: string, id: string, data: any) {
await this.findOne(userId, id);

return this.prisma.session.update({
  where: { id },
  data,
});
}
}