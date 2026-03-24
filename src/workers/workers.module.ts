import { Module } from '@nestjs/common';
import { SqsWorkersService } from './sqs-workers/sqs-workers.service';
import { AnalysisModule } from 'src/analysis/analysis.module';
@Module({
  imports: [AnalysisModule],
  providers: [SqsWorkersService]
})
export class WorkersModule {}
