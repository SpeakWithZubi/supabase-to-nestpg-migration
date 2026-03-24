import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChildProfilesModule } from './child-profiles/child-profiles.module';
import { SessionsModule } from './sessions/sessions.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkersModule } from './workers/workers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhooksController } from './analysis/webhooks/webhooks.controller';
import { ActivityBundlesModule } from './activity-bundles/activity-bundles.module'
@Module({
  imports: [ChildProfilesModule, SessionsModule, ReferenceDataModule, PrismaModule, AuthModule, UsersModule, WorkersModule,ScheduleModule.forRoot(),
    WorkersModule,ActivityBundlesModule],
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}
