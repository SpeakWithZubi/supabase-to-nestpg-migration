import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChildProfilesService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.childProfile.findFirst({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Child profile not found');
    return profile;
  }

  async upsertMe(userId: string, data: any) {
    // THE FIX: Clean the incoming data. We map 'name' to 'alias', and throw away 
    // any unknown fields like 'characteristics' or 'gender' that aren't in the schema.
    const safeData = {
      alias: data.alias || data.name || 'Anonymous', // Guarantee an alias
      age: data.age,
      grade: data.grade,
      // If the schema expects interests as an array of strings, we can pass it if it exists
      ...(data.interests && { interests: data.interests }) 
    };

    const existingProfile = await this.prisma.childProfile.findFirst({
      where: { userId },
    });

    if (existingProfile) {
      return this.prisma.childProfile.update({
        where: { userId },
        data: safeData,
      });
    } else {
      return this.prisma.childProfile.create({
        data: { 
          ...safeData, 
          userId 
        },
      });
    }
  }
}