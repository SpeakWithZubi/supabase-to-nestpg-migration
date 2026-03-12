import { Module } from '@nestjs/common';
import { ChildProfilesService } from './child-profiles.service';
import { ChildProfilesController } from './child-profiles.controller';

@Module({
  providers: [ChildProfilesService],
  controllers: [ChildProfilesController]
})
export class ChildProfilesModule {}
