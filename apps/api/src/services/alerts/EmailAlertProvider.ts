import { AlertProvider, AlertData } from './AlertProvider.js'
import { Resend } from 'resend'

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

    const isEmergency = type === 'emergency'
    const subject = isEmergency
      ? `🚨 [Replaysafe EMERGENCY] Circuit Breaker Tripped on "${monitor.name}"`
      : type === 'creation' 
        ? `[Replaysafe] Monitor "${monitor.name}" is DOWN` 
        : `[Replaysafe] Monitor "${monitor.name}" is RESOLVED`

    const body = this.renderTemplate(data)

    console.log(`[EmailProvider] Sending email to ${email}`)
    console.log(`Subject: ${subject}`)

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.warn(`[EmailProvider] RESEND_API_KEY not configured. Simulated email sending.`)
      return
    }

    const resend = new Resend(RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'alerts@replaysafe.com',
      to: email,
      subject,
      html: body,
    })
  }

  private renderTemplate(data: AlertData): string {
    const { monitor, incident, type } = data
    
    if (type === 'emergency') {
      return `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ff0055; border-radius: 8px; max-width: 600px;">
          <h1 style="color: #ff0055; margin-top: 0;">🔥 EMERGENCY: Circuit Breaker Tripped</h1>
          <h2 style="color: #333;">Monitor: ${monitor.name}</h2>
          <div style="background-color: #ffe6ec; border-left: 4px solid #ff0055; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 16px; color: #900;">
            <strong>Reason:</strong><br/>
            ${data.durationText || 'An infinite execution/retry loop was detected.'}
          </div>
          <p style="color: #666; line-height: 1.5;">
            Replaysafe has automatically tripped the circuit-breaker and temporarily blocked all new execution sessions for this monitor to protect downstream databases and services.
          </p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background-color: #ff0055; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View Dashboard & Clear Block
            </a>
          </p>
        </div>
      `
    } else if (type === 'creation') {
      return `
        <h1>Monitor DOWN: ${monitor.name}</h1>
        <p>Type: ${incident.type}</p>
        <p>Started At: ${incident.startedAt}</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors/${monitor.id}">View Details</a></p>
      `
    } else {
      return `
        <h1>Monitor RESOLVED: ${monitor.name}</h1>
        <p>Started At: ${incident.startedAt}</p>
        <p>Resolved At: ${incident.resolvedAt}</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors/${monitor.id}">View Details</a></p>
      `
    }
  }
}
