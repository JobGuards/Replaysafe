import { AlertProvider, AlertData } from './AlertProvider.js'


export class DiscordAlertProvider implements AlertProvider {
  async sendAlert(channelConfig: any, data: AlertData): Promise<void> {
    const { webhookUrl } = channelConfig
    if (!webhookUrl) throw new Error('Discord webhookUrl is missing')

    const isResolution = data.type === 'resolution'
    const statusText = isResolution ? 'RECOVERED' : 'DOWN'
    const color = isResolution ? 0xd9ff00 : 0xff4444 // Hex as integer
    const emoji = isResolution ? '✅' : '🚨'

    const payload = {
      embeds: [
        {
          title: `${emoji} Monitor ${statusText}: ${data.monitor.name}`,
          color: color,
          fields: [
            {
              name: 'Status',
              value: statusText,
              inline: true,
            },
            {
              name: 'Monitor',
              value: data.monitor.name,
              inline: true,
            },
            ...(data.durationText ? [
              {
                name: 'Downtime',
                value: data.durationText,
                inline: true,
              }
            ] : []),
            {
              name: 'Description',
              value: data.monitor.description || 'No description provided',
            },
          ],
          footer: {
            text: `StillUp Monitoring | ID: ${data.monitor.id}`,
          },
          timestamp: new Date().toISOString(),
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
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
      throw new Error(`Discord API error: ${response.status} - ${error}`)
    }
  }
}
