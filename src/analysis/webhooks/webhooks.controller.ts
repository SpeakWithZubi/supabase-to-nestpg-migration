import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Webhooks (AWS Lambda Callbacks)')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private prisma: PrismaService) {}

  @Post('report-pdf-generated')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook called by Lambda when PDF is successfully generated' })
  async reportPdfGenerated(@Body() body: { sessionId: string; report_pdf_url: string }) {
    const { sessionId, report_pdf_url } = body;

    if (!sessionId || !report_pdf_url) {
      return { error: 'Missing required fields' };
    }

    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          reportPdfGenerated: 'success',
          reportPdfUrl: report_pdf_url,
        },
      });
      this.logger.log(`✅ [Webhook] Updated PDF status to success for session ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ [Webhook] Failed to update PDF status for ${sessionId}`, error);
      return { error: 'Internal server error' };
    }
  }

  @Post('report-pdf-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook called by Lambda when PDF generation fails' })
  async reportPdfFailed(@Body() body: { sessionId: string; error?: string }) {
    const { sessionId, error: errorMessage } = body;

    if (!sessionId) return { error: 'Missing sessionId' };

    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { reportPdfGenerated: 'failed' },
      });
      this.logger.warn(`⚠️ [Webhook] PDF generation failed for session ${sessionId}: ${errorMessage}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ [Webhook] Failed to log PDF failure for ${sessionId}`, error);
      return { error: 'Internal server error' };
    }
  }

  @Post('report-pdf-sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook called by Lambda when PDF is successfully sent via WhatsApp' })
  async reportPdfSent(@Body() body: { sessionId: string }) {
    const { sessionId } = body;

    if (!sessionId) return { error: 'Missing sessionId' };

    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          reportPdfSent: 'success',
          sentAt: new Date(),
        },
      });
      this.logger.log(`✅ [Webhook] Updated WhatsApp sent status to success for session ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ [Webhook] Failed to update WhatsApp status for ${sessionId}`, error);
      return { error: 'Internal server error' };
    }
  }

  @Post('report-pdf-send-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook called by Lambda when WhatsApp sending fails' })
  async reportPdfSendFailed(@Body() body: { sessionId: string; error?: string }) {
    const { sessionId, error: errorMessage } = body;

    if (!sessionId) return { error: 'Missing sessionId' };

    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { reportPdfSent: 'failed' },
      });
      this.logger.warn(`⚠️ [Webhook] WhatsApp send failed for session ${sessionId}: ${errorMessage}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ [Webhook] Failed to log WhatsApp failure for ${sessionId}`, error);
      return { error: 'Internal server error' };
    }
  }
}