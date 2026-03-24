import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueueService } from '../../analysis/report-queue.service';
@Injectable()
export class SqsWorkersService {
  private readonly logger = new Logger(SqsWorkersService.name);
  private readonly sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

  constructor(
    private prisma: PrismaService,
    private reportQueue: ReportQueueService
  ) {}

  // =========================================================================
  // 1. OUTBOX RELAY: Runs every 1 second (1000ms)
  // Pulls from PostgreSQL job_outbox and sends to AWS SQS
  // =========================================================================
  @Interval(1000)
  async handleOutboxRelay() {
    if (!process.env.JOB_INPUT_QUEUE_URL) return;

    try {
      // 1. Fetch pending jobs
      const pendingJobs = await this.prisma.jobOutbox.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      if (pendingJobs.length === 0) return;

      this.logger.log(`📦 [OutboxRelay] Processing ${pendingJobs.length} job(s)`);

      // 2. Atomically lock them by marking as 'processing'
      const jobIds = pendingJobs.map(j => j.id);
      await this.prisma.jobOutbox.updateMany({
        where: { id: { in: jobIds }, status: 'pending' },
        data: { status: 'processing' }
      });

      // 3. Send to SQS and mark as 'sent'
      for (const job of pendingJobs) {
        try {
          await this.sqsClient.send(new SendMessageCommand({
            QueueUrl: process.env.JOB_INPUT_QUEUE_URL,
            MessageBody: JSON.stringify(job.payload),
          }));

          await this.prisma.jobOutbox.update({
            where: { id: job.id },
            data: { status: 'sent', sentAt: new Date() }
          });
          
          this.logger.log(`✅ [OutboxRelay] Relayed job ${job.id} for metric: ${job.metricKey}`);
        } catch (sqsError) {
          this.logger.error(`❌ [OutboxRelay] SQS send failed for ${job.id}`, sqsError);
          // Revert to pending so it retries next second
          await this.prisma.jobOutbox.update({
            where: { id: job.id },
            data: { status: 'pending' }
          });
        }
      }
    } catch (err) {
      this.logger.error('Critical error in Outbox Relay loop', err);
    }
  }

  // =========================================================================
  // 2. RESULT CONSUMER: Runs every 5 seconds (5000ms)
  // Pulls AI grades from AWS SQS and updates PostgreSQL
  // =========================================================================
  @Interval(5000)
  async handleResultConsumer() {
    if (!process.env.SQS_RESULT_QUEUE_URL) return;

    try {
      const response = await this.sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_RESULT_QUEUE_URL,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 30,
        WaitTimeSeconds: 0,
      }));

      const messages = response.Messages || [];
      if (messages.length === 0) return;

      this.logger.log(`📥 [ResultConsumer] Received ${messages.length} result(s) from AI`);

      for (const message of messages) {
        if (!message.ReceiptHandle || !message.Body) continue;

        try {
          const payload = JSON.parse(message.Body);
          const { sessionId, metricKey, score, feedback } = payload;

          // Normalize score (0 becomes null based on your Express logic)
          const normalizedScore = (score === 0 || score < 1 || score > 5) ? null : score;

          // Update the database
          await this.prisma.metricComputation.updateMany({
            where: { sessionId, metricKey },
            data: {
              status: 'completed',
              score: normalizedScore,
              // @ts-ignore - Bypass strict JSON typing
              feedback: feedback, 
              metricName: feedback?.metric_name,
              updatedAt: new Date()
            }
          });

          this.logger.log(`✅ [ResultConsumer] Saved score ${score} for ${metricKey}`);

          // Delete message from SQS so we don't process it again
          await this.sqsClient.send(new DeleteMessageCommand({
            QueueUrl: process.env.SQS_RESULT_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          }));

        } catch (parseError) {
          this.logger.error('❌ [ResultConsumer] Error processing SQS message', parseError);
          // We do NOT delete the message, allowing SQS Visibility Timeout to retry it
        }
      }
    } catch (err) {
      this.logger.error('Critical error in Result Consumer loop', err);
    }
  }

  // =========================================================================
  // 3. SESSION COMPLETION MONITOR: Runs every 10 seconds (10000ms)
  // Checks for fully graded sessions and triggers PDF generation
  // =========================================================================
  @Interval(10000)
  async handleSessionCompletionMonitor() {
    try {
      // Find sessions completed in the last 7 days that need a report
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const candidateSessions = await this.prisma.session.findMany({
        where: {
          status: 'completed',
          parentPhoneNumber: { not: null }, // Only process new structure sessions
          updatedAt: { gte: sevenDaysAgo },
          OR: [
            { reportPdfGenerated: null },
            { reportPdfGenerated: 'failed' }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      if (candidateSessions.length === 0) return;

      this.logger.log(`📋 [CompletionMonitor] Found ${candidateSessions.length} session(s) ready for PDF generation`);

      for (const session of candidateSessions) {
        // Mark as in_progress to prevent duplicate triggers
        await this.prisma.session.update({
          where: { id: session.id },
          data: { reportPdfGenerated: 'in_progress', generatedAt: new Date() }
        });

        // Trigger the report queue
        const published = await this.reportQueue.publishSessionToReportQueue(session.id);

        if (!published) {
          // Revert on failure
          await this.prisma.session.update({
            where: { id: session.id },
            data: { reportPdfGenerated: 'failed' }
          });
        }
      }
    } catch (err) {
      this.logger.error('Critical error in Session Completion Monitor loop', err);
    }
  }
}