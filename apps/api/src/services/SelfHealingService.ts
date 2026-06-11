import { prisma } from '@replaysafe/db'
import axios from 'axios'
import { validateWebhookUrl } from '../utils/validateUrl.js'

/**
 * Adds a randomized jitter delay to prevent stampeding herd effects when many
 * monitors recover simultaneously and all fire self-healing webhooks at once.
 *
 * @param minMs  Minimum delay in ms (default: 5000)
 * @param maxMs  Maximum delay in ms (default: 30000)
 */
async function applyJitter(minMs = 5000, maxMs = 30000): Promise<void> {
  const delayMs = minMs + Math.random() * (maxMs - minMs);
  console.log(`[SelfHealing] Applying ${Math.round(delayMs / 1000)}s jitter before replay...`);
  await new Promise(r => setTimeout(r, delayMs));
}

export class SelfHealingService {
  /**
   * Attempts to self-heal a monitor based on its policy.
   *
   * Self-healing policy shape (stored in monitor.selfHealing JSON field):
   * {
   *   enabled: boolean,
   *   maxRetries: number,          // Max heal attempts per incident (default: 3)
   *   minCooldownSeconds: number,  // Min gap between attempts (default: 60s)
   *   autoReplay: boolean,
   *   replayUrl?: string,
   *   webhookUrl?: string
   * }
   */
  async attemptHeal(monitorId: string, incidentId: string) {
    const monitor = await (prisma as any).monitor.findUnique({
      where: { id: monitorId }
    })

    if (!monitor || !monitor.selfHealing) return

    const policy = monitor.selfHealing as any
    if (!policy.enabled) return

    // 1. Loop protection: Check if we have already hit max retries for this incident
    const maxRetries = policy.maxRetries || 3
    const previousAttempts = await (prisma as any).auditLog.findMany({
      where: {
        resourceType: 'MONITOR',
        resourceId: monitorId,
        action: 'SELF_HEAL_ATTEMPT',
        projectId: monitor.projectId
      }
    })

    const incidentAttempts = previousAttempts.filter((log: any) => {
      const meta = log.metadata as any
      return meta && meta.incidentId === incidentId
    })

    if (incidentAttempts.length >= maxRetries) {
      console.warn(`[SelfHealing] Max retries (${maxRetries}) reached for incident ${incidentId}. Skipping self-healing.`)
      await (prisma as any).auditLog.create({
        data: {
          projectId: monitor.projectId,
          action: 'SELF_HEAL_EXHAUSTED',
          resourceType: 'MONITOR',
          resourceId: monitorId,
          metadata: { incidentId, attempts: incidentAttempts.length }
        }
      })
      return
    }

    // 2. Rate-limit: Enforce minimum cooldown between self-heal attempts for the same incident.
    //    This prevents hammering a struggling downstream service that keeps failing.
    const minCooldownMs = (policy.minCooldownSeconds ?? 60) * 1000
    if (incidentAttempts.length > 0) {
      const sortedAttempts = [...incidentAttempts].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      const lastAttemptMs = new Date(sortedAttempts[0].createdAt).getTime()
      const msSinceLast = Date.now() - lastAttemptMs

      if (msSinceLast < minCooldownMs) {
        console.warn(
          `[SelfHealing] Rate-limited for incident ${incidentId}. ` +
          `Last attempt was ${Math.round(msSinceLast / 1000)}s ago ` +
          `(min cooldown: ${minCooldownMs / 1000}s). Skipping.`
        )
        return
      }
    }

    console.log(`[SelfHealing] Attempting to heal monitor: ${monitor.name} (${monitorId}). Attempt #${incidentAttempts.length + 1}/${maxRetries}`)

    // 3. Log the attempt before firing the webhook
    await (prisma as any).auditLog.create({
      data: {
        projectId: monitor.projectId,
        action: 'SELF_HEAL_ATTEMPT',
        resourceType: 'MONITOR',
        resourceId: monitorId,
        metadata: { incidentId, policy, attempt: incidentAttempts.length + 1 }
      }
    })

    // 4. Execute general healing webhook if configured (non-autoReplay mode)
    if (policy.webhookUrl && !policy.autoReplay) {
      try {
        validateWebhookUrl(policy.webhookUrl)
        await axios.post(policy.webhookUrl, {
          monitorId,
          monitorName: monitor.name,
          incidentId,
          action: 'RETRIGGER_JOB',
          timestamp: new Date().toISOString()
        }, { timeout: 10000 })
        console.log(`[SelfHealing] Webhook triggered successfully for ${monitor.name}`)
      } catch (error: any) {
        console.error(`[SelfHealing] Webhook failed for ${monitor.name}:`, error.message)
      }
    }

    // 5. Autonomous ReplayGuard re-trigger (the core "2 AM Promise")
    //    Apply jitter BEFORE firing to prevent stampeding herds after a mass outage.
    //    This spreads replay traffic across 5–30s instead of hitting everything simultaneously.
    if (monitor.type === 'HEARTBEAT' && policy.autoReplay) {
      const lastExecution = await (prisma as any).guardExecution.findFirst({
        where: { monitorId },
        orderBy: { startedAt: 'desc' }
      })

      const targetUrl = policy.replayUrl || policy.webhookUrl
      if (targetUrl) {
        try {
          validateWebhookUrl(targetUrl)
          // Apply jitter before firing to avoid thundering herd
          await applyJitter(
            (policy.jitterMinSeconds ?? 5) * 1000,
            (policy.jitterMaxSeconds ?? 30) * 1000
          )

          await axios.post(targetUrl, {
            monitorId,
            monitorName: monitor.name,
            incidentId,
            externalId: lastExecution?.externalId || null,
            lastAttempt: lastExecution?.attempt || 0,
            action: 'AUTO_REPLAY',
            timestamp: new Date().toISOString()
          }, { timeout: 10000 })
          console.log(`[SelfHealing] Auto-replay webhook triggered for ${monitor.name} → ${targetUrl}`)
        } catch (error: any) {
          console.error(`[SelfHealing] Auto-replay webhook failed for ${monitor.name} at ${targetUrl}:`, error.message)
        }
      } else {
        console.warn(`[SelfHealing] No replayUrl or webhookUrl configured for ${monitor.name}. Self-healing skipped.`)
      }
    }
  }
}

export const selfHealingService = new SelfHealingService()
