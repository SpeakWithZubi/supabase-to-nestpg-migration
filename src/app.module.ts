import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChildProfilesModule } from './child-profiles/child-profiles.module';
import { SessionsModule } from './sessions/sessions.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ChildProfilesModule, SessionsModule, ReferenceDataModule, PrismaModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
