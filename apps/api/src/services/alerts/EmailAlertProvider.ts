import { AlertProvider, AlertData } from './AlertProvider.js'

export class EmailAlertProvider implements AlertProvider {
  /**
   * Send an email alert
   */
  async sendAlert(channelConfig: any, data: AlertData): Promise<void> {
    const { email } = channelConfig
    const { monitor, incident, type } = data

    if (!email) {
      throw new Error('Email configuration missing')
    }

    const subject = type === 'creation' 
      ? `[StillUp] Monitor "${monitor.name}" is DOWN` 
      : `[StillUp] Monitor "${monitor.name}" is RESOLVED`

    const body = this.renderTemplate(data)

    console.log(`[EmailProvider] Sending email to ${email}`)
    console.log(`Subject: ${subject}`)
    // console.log(`Body: ${body}`)

    // TODO: Integrate with Resend/Postmark/SendGrid
    // await resend.emails.send({ from, to: email, subject, html: body })
  }

  private renderTemplate(data: AlertData): string {
    const { monitor, incident, type } = data
    
    if (type === 'creation') {
      return `
        <h1>Monitor DOWN: ${monitor.name}</h1>
        <p>Type: ${incident.type}</p>
        <p>Started At: ${incident.startedAt}</p>
        <p><a href="${process.env.FRONTEND_URL}/monitors/${monitor.id}">View Details</a></p>
      `
    } else {
      return `
        <h1>Monitor RESOLVED: ${monitor.name}</h1>
        <p>Started At: ${incident.startedAt}</p>
        <p>Resolved At: ${incident.resolvedAt}</p>
        <p><a href="${process.env.FRONTEND_URL}/monitors/${monitor.id}">View Details</a></p>
      `
    }
  }
}
