import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class UpdateUserDto {
@ApiProperty({ example: 'John Doe', required: false })
displayName?: string;

@ApiProperty({ example: true, required: false })
hasCompletedOnboarding?: boolean;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
constructor(private readonly usersService: UsersService) {}

@Get('me')
@ApiOperation({ summary: 'Get current user profile' })
getMe(@Request() req) {
return this.usersService.getMe(req.user.id);
}

@Patch('me')
@ApiOperation({ summary: 'Update current user profile' })
updateMe(@Request() req, @Body() body: UpdateUserDto) {
return this.usersService.updateMe(req.user.id, body);
}
}