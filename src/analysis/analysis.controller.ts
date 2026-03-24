import { Controller, Post, Get, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { ActivityCompleteDto } from './analysis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('activity-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger the chain reaction after a child completes an activity' })
  async activityComplete(@Request() req, @Body() body: ActivityCompleteDto) {
    return this.analysisService.handleActivityComplete(req.user.id, body);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get the aggregated status of all metrics for a session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  async getSessionStatus(@Request() req, @Param('sessionId') sessionId: string) {
    return this.analysisService.getSessionAggregateStatus(req.user.id, sessionId);
  }
}