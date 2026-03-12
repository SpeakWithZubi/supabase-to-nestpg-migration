import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChildProfilesService {
constructor(private prisma: PrismaService) {}

async getMe(userId: string) {
const profile = await this.prisma.childProfile.findUnique({
where: { userId },
});
if (!profile) throw new NotFoundException('Child profile not found');
return profile;
}

async upsertMe(userId: string, data: any) {
return this.prisma.childProfile.upsert({
where: { userId },
update: data,
create: { ...data, userId },
});
}
}