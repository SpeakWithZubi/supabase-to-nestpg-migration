import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ChildProfilesService } from './child-profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('child-profiles')
@UseGuards(JwtAuthGuard)
export class ChildProfilesController {
constructor(private readonly childProfilesService: ChildProfilesService) {}

@Get('me')
getMe(@Request() req) {
return this.childProfilesService.getMe(req.user.id);
}

@Put('me')
upsertMe(@Request() req, @Body() body: any) {
return this.childProfilesService.upsertMe(req.user.id, body);
}
}