import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { ChildProfilesService } from './child-profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class UpsertChildProfileDto {
@ApiProperty({ example: 'Leo' })
name: string;

@ApiProperty({ example: 5 })
age: number;

@ApiProperty({ example: 'Male', required: false })
gender?: string;

@ApiProperty({ example: { favoriteColor: 'blue', interests: ['cars', 'dinosaurs'] }, required: false })
characteristics?: any;
}

@ApiTags('Child Profiles')
@ApiBearerAuth()
@Controller('child-profiles')
@UseGuards(JwtAuthGuard)
export class ChildProfilesController {
constructor(private readonly childProfilesService: ChildProfilesService) {}

@Get('me')
@ApiOperation({ summary: 'Get child profile for current user' })
getMe(@Request() req) {
return this.childProfilesService.getMe(req.user.id);
}

@Put('me')
@ApiOperation({ summary: 'Create or update child profile' })
upsertMe(@Request() req, @Body() body: UpsertChildProfileDto) {
return this.childProfilesService.upsertMe(req.user.id, body);
}
}