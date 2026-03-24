import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportQueueService {
  private readonly logger = new Logger(ReportQueueService.name);
  private readonly sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

  constructor(private prisma: PrismaService) {}

  async publishSessionToReportQueue(sessionId: string): Promise<boolean> {
    if (!process.env.REPORT_RENDER_QUEUE_URL) {
      this.logger.error('REPORT_RENDER_QUEUE_URL not configured');
      return false;
    }

    try {
      // 1. Fetch  session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.error(`Session ${sessionId} not found`);
        return false;
      }

      // 2. Fetch parameter definitions 
      const definitions = await this.prisma.parameterDefinition.findMany({
        where: { isActive: true },
      });

      const definitionByKey: Record<string, any> = {};
      for (const def of definitions) {
        definitionByKey[def.parameterKey] = {
          parameter_key: def.parameterKey,
          metric_name: def.metricName,
          what_it_is: def.whatItIs,
          why_it_matters: def.whyItMatters,
          is_active: def.isActive,
        };
      }

      // 3. Extract Phone Number safely
      let parentPhone = session.parentPhoneNumber;
      if (!parentPhone && session.childProfile) {
        try {
          const profile = typeof session.childProfile === 'string' 
            ? JSON.parse(session.childProfile) 
            : session.childProfile;
          parentPhone = profile?.parent_phone_number || profile?.parentPhoneNumber || null;
        } catch (e) {
          // ignore parsing errors
        }
      }

      // 4. Format exactly as the Python PDF Lambda expects (array with single object)
      const messageBody = JSON.stringify([{
        idx: 0,
        id: session.id,
        user_id: session.userId,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        session_name: session.sessionName,
        status: session.status,
        child_profile: typeof session.childProfile === 'string' ? session.childProfile : JSON.stringify(session.childProfile),
        transcript_bundle: typeof session.transcriptBundle === 'string' ? session.transcriptBundle : JSON.stringify(session.transcriptBundle),
        child_enjoyment_rating: session.childEnjoymentRating,
        child_enjoyment_feedback: session.childEnjoymentFeedback,
        analysis_helpfulness_rating: session.analysisHelpfulnessRating,
        analysis_helpfulness_feedback: session.analysisHelpfulnessFeedback,
        feedback_submitted_at: session.feedbackSubmittedAt,
        combined_audio_url: session.combinedAudioUrl,
        aggregated_result: typeof session.aggregatedResult === 'string' ? session.aggregatedResult : JSON.stringify(session.aggregatedResult),
        parent_phone_number: parentPhone,
        definitionByKey: JSON.stringify(definitionByKey),
      }]);

      // 5. Send to AWS SQS
      await this.sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.REPORT_RENDER_QUEUE_URL,
        MessageBody: messageBody,
      }));

      this.logger.log(`✅ Successfully published session ${sessionId} to report rendering queue`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Failed to publish session ${sessionId} to report queue`, error);
      return false;
    }
  }
}