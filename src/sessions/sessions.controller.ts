import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class CreateSessionDto {
@ApiProperty({ example: 'activity-123' })
activityId: string;

@ApiProperty({ example: 'IN_PROGRESS' })
status: string;
}

export class UpdateSessionDto {
@ApiProperty({ example: 'COMPLETED', required: false })
status?: string;

@ApiProperty({ example: { score: 85, duration: 120 }, required: false })
metrics?: any;

@ApiProperty({ example: 'Child showed great focus today.', required: false })
notes?: string;
}

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
constructor(private readonly sessionsService: SessionsService) {}

@Get()
@ApiOperation({ summary: 'Get all sessions for user' })
findAll(@Request() req) {
return this.sessionsService.findAll(req.user.id);
}

@Get(':id')
@ApiOperation({ summary: 'Get a specific session by ID' })
findOne(@Request() req, @Param('id') id: string) {
return this.sessionsService.findOne(req.user.id, id);
}

@Post()
@ApiOperation({ summary: 'Create a new session' })
create(@Request() req, @Body() body: CreateSessionDto) {
return this.sessionsService.create(req.user.id, body);
}

@Patch(':id')
@ApiOperation({ summary: 'Update an existing session' })
update(@Request() req, @Param('id') id: string, @Body() body: UpdateSessionDto) {
return this.sessionsService.update(req.user.id, id, body);
}
}