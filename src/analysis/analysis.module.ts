import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { ReportQueueService } from './report-queue.service';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, ReportQueueService],
  exports: [ReportQueueService] 
})
export class AnalysisModule {}