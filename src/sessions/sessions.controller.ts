import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
constructor(private readonly sessionsService: SessionsService) {}

@Get()
findAll(@Request() req) {
return this.sessionsService.findAll(req.user.id);
}

@Get(':id')
findOne(@Request() req, @Param('id') id: string) {
return this.sessionsService.findOne(req.user.id, id);
}

@Post()
create(@Request() req, @Body() body: any) {
return this.sessionsService.create(req.user.id, body);
}

@Patch(':id')
update(@Request() req, @Param('id') id: string, @Body() body: any) {
return this.sessionsService.update(req.user.id, id, body);
}
}