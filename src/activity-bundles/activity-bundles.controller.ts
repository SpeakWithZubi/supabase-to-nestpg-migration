import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ActivityBundlesService } from './activity-bundles.service';
import { CreateActivityBundleDto } from './activity-bundles.dto/activity-bundles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Activity Bundles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-bundles')
export class ActivityBundlesController {
  constructor(private readonly activityBundlesService: ActivityBundlesService) {}

  @Post()
  @ApiOperation({ summary: 'Save a completed activity bundle from the frontend' })
  create(@Request() req, @Body() body: CreateActivityBundleDto) {
    return this.activityBundlesService.createBundle(req.user.id, body);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get all activity bundles for a specific session' })
  findBySession(@Request() req, @Param('sessionId') sessionId: string) {
    return this.activityBundlesService.getBundlesForSession(req.user.id, sessionId);
  }
}