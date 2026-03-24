import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityCompleteDto } from './analysis.dto';
import { extractTranscriptFromBundle, extractTranscriptsFromBundles } from '../utils/transcript-extractor.util';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private prisma: PrismaService) {}

  async handleActivityComplete(userId: string, data: ActivityCompleteDto) {
    const { sessionId, activityKey, transcript, audioUrl } = data;

    // 1. Authenticate the session
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or unauthorized');
    }

    // 2. Preload all completed activity bundles for this session
    const completedBundles = await this.prisma.activityBundle.findMany({
      where: { sessionId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    // Pick the most recent bundle per activity_key (fast lookup)
    const latestBundleByActivityKey = new Map<string, any>();
    for (const b of completedBundles) {
      if (b.activityKey && !latestBundleByActivityKey.has(b.activityKey)) {
        latestBundleByActivityKey.set(b.activityKey, b);
      }
    }

    const requestBundle = latestBundleByActivityKey.get(activityKey);

    // 3. Get all ACTIVE parameter definitions (metrics we care about)
    const allDefinitions = await this.prisma.parameterDefinition.findMany({
      where: { isActive: true },
    });

    if (!allDefinitions || allDefinitions.length === 0) {
      return { message: 'No metrics configured to process' };
    }

    // 4. Preload existing metric computations for idempotency
    const existingMetrics = await this.prisma.metricComputation.findMany({
      where: { sessionId },
    });
    
    const existingStatusByKey = new Map<string, string>();
    for (const m of existingMetrics) {
      existingStatusByKey.set(m.metricKey, m.status || 'pending');
    }

    // 5. THE CHAIN REACTION: Evaluate every metric against current dependencies
    for (const def of allDefinitions) {
      const metricKey = def.parameterKey;
      const metricName = def.metricName || metricKey;

      // Safely parse dependencies (handles both stringified JSON and native string arrays)
      let dependsOnActivities: string[] = [];
      if (def.dependsOnActivities) {
        dependsOnActivities = typeof def.dependsOnActivities === 'string'
          ? JSON.parse(def.dependsOnActivities)
          : def.dependsOnActivities;
      }

      // Are all required activities completed?
      const hasActivities = dependsOnActivities.every(k => latestBundleByActivityKey.has(k));
      const canCompute = dependsOnActivities.length === 0 || hasActivities;

      if (canCompute) {
        // Idempotency check: don't double-process
        const existingStatus = existingStatusByKey.get(metricKey);
        if (['queued', 'processing', 'completed'].includes(existingStatus || '')) {
          continue; 
        }

        this.logger.log(`✅ Dependencies met for ${metricKey}. Triggering analysis...`);

        // 5a. Upsert Metric Status to 'queued' safely (avoiding Prisma upsert bugs)
        const existingComputation = await this.prisma.metricComputation.findFirst({
          where: { sessionId, metricKey }
        });

        if (existingComputation) {
           await this.prisma.metricComputation.update({
             where: { id: existingComputation.id },
             data: { status: 'queued', metricName }
           });
        } else {
           await this.prisma.metricComputation.create({
             data: { sessionId, metricKey, metricName, status: 'queued' }
           });
        }
        existingStatusByKey.set(metricKey, 'queued');

        // 5b. Build SQS Job Payload
        const sourceBundles = dependsOnActivities.length > 0
          ? dependsOnActivities.map(k => latestBundleByActivityKey.get(k)).filter(Boolean)
          : Array.from(latestBundleByActivityKey.values());

        // Resolve the best transcript
        let resolvedTranscript = transcript;
        if (!resolvedTranscript) {
          if (dependsOnActivities.length === 1) {
            resolvedTranscript = extractTranscriptFromBundle(latestBundleByActivityKey.get(dependsOnActivities[0])?.bundleJson);
          } else if (sourceBundles.length > 0) {
            resolvedTranscript = extractTranscriptsFromBundles(sourceBundles, '\n\n');
          } else {
            resolvedTranscript = extractTranscriptFromBundle(requestBundle?.bundleJson);
          }
        }

        const resolvedAudioUrl = audioUrl ||
          (dependsOnActivities.length === 1 ? latestBundleByActivityKey.get(dependsOnActivities[0])?.audioUrl : undefined) ||
          requestBundle?.audioUrl;

        const resolvedActivityBundleId = sourceBundles[0]?.id || requestBundle?.id || null;

        const payload = {
          session_id: sessionId,
          metric_key: metricKey,
          metric_name: metricName,
          data: {
            transcript: resolvedTranscript || '',
            audio_url: resolvedAudioUrl,
            metadata: {
              activity_key: activityKey,
              source_activity_keys: dependsOnActivities.length > 0 ? dependsOnActivities : Array.from(latestBundleByActivityKey.keys()),
              source_bundle_ids: sourceBundles.map(b => b.id)
            }
          }
        };

        // 5c. Prevent duplicate outbox entries
        const existingJob = await this.prisma.jobOutbox.findFirst({
           where: { sessionId, metricKey, status: { in: ['pending', 'processing'] } }
        });

        if (!existingJob) {
           await this.prisma.jobOutbox.create({
             data: {
               sessionId,
               metricKey,
               metricName,
               activityBundleId: resolvedActivityBundleId,
               // @ts-ignore - Bypass strict JSON typing for Prisma payload
               payload: payload, 
               status: 'pending'
             }
           });
        }
      } else {
        // If it cannot compute yet, mark it as 'blocked' (if not already completed)
        const existingStatus = existingStatusByKey.get(metricKey);
        if (existingStatus === 'completed') continue;

        const existingComputation = await this.prisma.metricComputation.findFirst({
          where: { sessionId, metricKey }
        });

        if (existingComputation) {
          await this.prisma.metricComputation.update({
            where: { id: existingComputation.id },
            data: { status: 'blocked', metricName }
          });
        } else {
          await this.prisma.metricComputation.create({
            data: { sessionId, metricKey, metricName, status: 'blocked' }
          });
        }
        existingStatusByKey.set(metricKey, 'blocked');
      }
    }

    return { message: 'Activity logged and analysis chain reaction evaluated successfully' };
  }
  
  // =========================================================================
  // FRONTEND AGGREGATION: Calculates the overall status of the AI grading
  // =========================================================================
  async getSessionAggregateStatus(userId: string, sessionId: string) {
    // 1. Verify ownership
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId: userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or does not belong to you');
    }

    // 2. Determine expected metrics (Active parameter definitions)
    const defs = await this.prisma.parameterDefinition.findMany({
      where: { isActive: true },
      select: { parameterKey: true }
    });
    const expectedMetricKeys = new Set(defs.map(d => d.parameterKey));

    // 3. Load computed metrics for this session
    const metrics = await this.prisma.metricComputation.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Calculate the exact counts
    const counts = {
      expected_total: expectedMetricKeys.size,
      present_total: metrics.length,
      blocked: metrics.filter(m => m.status === 'blocked').length,
      queued: metrics.filter(m => m.status === 'queued').length,
      processing: metrics.filter(m => m.status === 'processing').length,
      completed: metrics.filter(m => m.status === 'completed').length,
      failed: metrics.filter(m => m.status === 'failed').length,
    };

    const anyInFlight = counts.queued > 0 || counts.processing > 0 || counts.blocked > 0;
    
    const allExpectedHaveRows = expectedMetricKeys.size === 0 ? true :
      metrics.every(m => expectedMetricKeys.has(m.metricKey)) &&
      new Set(metrics.map(m => m.metricKey)).size >= expectedMetricKeys.size;

    // 5. Determine Overall Status for the Frontend
    let overallStatus: 'not_started' | 'in_progress' | 'completed' | 'completed_with_failures' | 'blocked' | 'failed';

    if (metrics.length === 0) {
      overallStatus = 'not_started';
    } else if (counts.failed > 0 && counts.completed === 0) {
      overallStatus = 'failed';
    } else if (anyInFlight) {
      overallStatus = counts.blocked > 0 ? 'blocked' : 'in_progress';
    } else if (counts.failed > 0) {
      overallStatus = 'completed_with_failures';
    } else {
      overallStatus = 'completed';
    }

    return {
      sessionId,
      overallStatus,
      counts,
      expectedMetricKeys: Array.from(expectedMetricKeys),
      metrics,
      session: {
        id: session.id,
        status: session.status,
        createdAt: session.createdAt,
      },
      meta: {
        allExpectedHaveRows,
      },
    };
  }
}