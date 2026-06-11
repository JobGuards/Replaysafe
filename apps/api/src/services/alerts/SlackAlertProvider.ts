import { AlertProvider, AlertData } from './AlertProvider.js'
import { validateWebhookUrl } from '../../utils/validateUrl.js'


export class SlackAlertProvider implements AlertProvider {
  async sendAlert(channelConfig: any, data: AlertData): Promise<void> {
    const { webhookUrl } = channelConfig
    if (!webhookUrl) throw new Error('Slack webhookUrl is missing')
    validateWebhookUrl(webhookUrl)

    const isResolution = data.type === 'resolution'
    const isEmergency = data.type === 'emergency'
    
    let statusText = 'DOWN'
    let color = '#ff4444'
    let emoji = '🚨'

    if (isResolution) {
      statusText = 'RECOVERED'
      color = '#d9ff00'
      emoji = '✅'
    } else if (isEmergency) {
      statusText = 'EMERGENCY: CIRCUIT BREAKER TRIPPED'
      color = '#ff0055'
      emoji = '🔥'
    }

    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: isEmergency 
              ? `${emoji} *${statusText}*`
              : `${emoji} *Monitor ${statusText}: ${data.monitor.name}*`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status:*\n${statusText}`,
            },
            {
              type: 'mrkdwn',
              text: `*Monitor:*\n${data.monitor.name}`,
            },
            ...(data.durationText ? [
              {
                type: 'mrkdwn',
                text: isEmergency
                  ? `*Details:*\n${data.durationText}`
                  : `*Downtime:*\n${data.durationText}`,
              }
            ] : []),
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*ID:* \`${data.monitor.id}\` | *Time:* ${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
              },
              url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
              style: isResolution ? 'primary' : 'danger',
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Slack API error: ${response.status} - ${error}`)
    }
  }
}
