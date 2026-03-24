import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityBundleDto } from './activity-bundles.dto/activity-bundles.dto';
@Injectable()
export class ActivityBundlesService {
  constructor(private prisma: PrismaService) {}

  async createBundle(userId: string, data: CreateActivityBundleDto) {
    const session = await this.prisma.session.findFirst({
      where: { id: data.sessionId, userId: userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or does not belong to you');
    }

    const bundle = await this.prisma.activityBundle.create({
      data: {
        sessionId: data.sessionId,
        activityId: data.activityId,
        activityKey: data.activityKey,
        ageGroupId: data.ageGroupId,
        bundleJson: data.bundleJson, 
        status: data.status,
        audioUrl: data.audioUrl,
        audioFileId: data.audioFileId,
        audioDurationMs: data.audioDurationMs,
        audioFileSizeBytes: data.audioFileSizeBytes,
      },
    });

    return bundle;
  }

  async getBundlesForSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId: userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or does not belong to you');
    }

    return this.prisma.activityBundle.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}