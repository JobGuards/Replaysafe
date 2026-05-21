import { prisma } from '@replaysafe/db'
import { EmailAlertProvider } from './alerts/EmailAlertProvider.js'
import { WebhookAlertProvider } from './alerts/WebhookAlertProvider.js'
import { SlackAlertProvider } from './alerts/SlackAlertProvider.js'
import { DiscordAlertProvider } from './alerts/DiscordAlertProvider.js'
import { AlertProvider, AlertData } from './alerts/AlertProvider.js'
import { decryptJSON } from '../utils/encryption.js'

export class AlertService {
  private providers: Record<string, AlertProvider> = {
    email: new EmailAlertProvider(),
    webhook: new WebhookAlertProvider(),
    slack: new SlackAlertProvider(),
    discord: new DiscordAlertProvider(),
  }

  /**
   * Send alerts for a new incident
   */
  async sendIncidentAlert(incident: any) {
    const monitor = await (prisma.monitor as any).findUnique({
      where: { id: incident.monitorId },
    })

    if (!monitor) return

    const channels = await this.getEnabledChannels(monitor.projectId)
    
    for (const channel of channels) {
      await this.sendToChannel(channel, {
        monitor,
        incident,
        type: 'creation',
      })
    }
  }

  /**
   * Send alerts for a resolved incident
   */
  async sendResolutionAlert(incident: any) {
    const monitor = await (prisma.monitor as any).findUnique({
      where: { id: incident.monitorId },
    })

    if (!monitor) return

    const channels = await this.getEnabledChannels(monitor.projectId)
    
    // Calculate downtime duration
    const startedAt = new Date(incident.startedAt)
    const resolvedAt = new Date(incident.resolvedAt || Date.now())
    const durationMs = resolvedAt.getTime() - startedAt.getTime()
    
    const durationMinutes = Math.floor(durationMs / 60000)
    const durationSeconds = Math.floor((durationMs % 60000) / 1000)
    const durationText = durationMinutes > 0 
      ? `${durationMinutes}m ${durationSeconds}s`
      : `${durationSeconds}s`

    for (const channel of channels) {
      await this.sendToChannel(channel, {
        monitor,
        incident,
        type: 'resolution',
        durationText,
      })
    }
  }

  /**
   * Send alerts for a critical system emergency (e.g. infinite loop blocked)
   */
  async sendEmergencyAlert(projectId: string, monitorId: string, alertType: string, message: string) {
    const monitor = await (prisma.monitor as any).findUnique({
      where: { id: monitorId },
    })

    if (!monitor) return

    // Create a mock incident so standard alert delivery pipeline works
    const mockIncident = {
      id: 'emergency-alert',
      monitorId,
      type: 'emergency',
      startedAt: new Date(),
      resolutionNotes: message
    }

    const channels = await this.getEnabledChannels(projectId)
    for (const channel of channels) {
      await this.sendToChannel(channel, {
        monitor,
        incident: mockIncident,
        type: 'emergency',
        durationText: message
      })
    }
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(channel: any, data: AlertData & { durationText?: string }) {
    const provider = this.providers[channel.type.toLowerCase()]
    
    if (!provider) {
      console.warn(`[AlertService] No provider found for channel type: ${channel.type}`)
      return
    }

    // Create Alert record to track delivery
    const alertRecord = await (prisma.alert as any).create({
      data: {
        incidentId: data.incident.id,
        channelId: channel.id,
        status: 'pending',
      },
    })

    try {
      // Decrypt config before sending
      console.log(`[AlertService] Delivering to ${channel.type} (ID: ${channel.id})`)
      const decryptedConfig = typeof channel.config === 'string' 
        ? decryptJSON(channel.config) 
        : channel.config

      console.log(`[AlertService] Config Keys: ${Object.keys(decryptedConfig || {}).join(', ')}`)

      await provider.sendAlert(decryptedConfig, data)
      
      // Update Alert record on success
      await (prisma.alert as any).update({
        where: { id: alertRecord.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error(`[AlertService] Error sending alert to channel ${channel.id}:`, error)
      
      // Update Alert record on failure
      await (prisma.alert as any).update({
        where: { id: alertRecord.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
  }

  /**
   * Get all enabled alert channels for a project
   */
  private async getEnabledChannels(projectId: string) {
    const channels = await (prisma.alertChannel as any).findMany({
      where: {
        projectId,
        enabled: true,
      },
    })

    // Decrypt configs and filter out failed decryptions
    return channels.map((c: any) => {
      try {
        const decryptedConfig = typeof c.config === 'string' ? decryptJSON(c.config) : c.config
        // If decryption failed, it might return a string or an object without expected keys
        if (typeof decryptedConfig !== 'object' || decryptedConfig === null) {
          console.warn(`[AlertService] Skipping channel ${c.id}: Configuration decryption failed.`)
          return null
        }
        return { ...c, config: decryptedConfig }
      } catch (e) {
        console.warn(`[AlertService] Skipping channel ${c.id}: Decryption error.`)
        return null
      }
    }).filter(Boolean) as any[]
  }
}

export const alertService = new AlertService()
