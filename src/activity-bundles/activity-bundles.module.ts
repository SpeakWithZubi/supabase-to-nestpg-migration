import { Module } from '@nestjs/common';
import { ActivityBundlesController } from './activity-bundles.controller';
import { ActivityBundlesService } from './activity-bundles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityBundlesController],
  providers: [ActivityBundlesService],
})
export class ActivityBundlesModule {}