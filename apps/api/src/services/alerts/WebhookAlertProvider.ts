import { AlertProvider, AlertData } from './AlertProvider.js'
import crypto from 'crypto'
import { validateWebhookUrl } from '../../utils/validateUrl.js'

export class WebhookAlertProvider implements AlertProvider {
  /**
   * Send a webhook alert
   */
  async sendAlert(channelConfig: any, data: AlertData): Promise<void> {
    const { url, secret } = channelConfig
    const { monitor, incident, type } = data

    if (!url) {
      throw new Error('Webhook URL missing')
    }
    validateWebhookUrl(url)

    const payload = {
      event: type === 'emergency' 
        ? 'incident.emergency'
        : type === 'creation' 
          ? 'incident.created' 
          : 'incident.resolved',
      timestamp: new Date().toISOString(),
      monitor,
      incident,
    }

    const body = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
      headers['X-Replaysafe-Signature'] = signature
    }

    console.log(`[WebhookProvider] Sending webhook to ${url}`)

    const ABORT_TIMEOUT = 5000

    let lastError: Error | undefined
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), ABORT_TIMEOUT)
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`)
        }
        
        console.log(`[WebhookProvider] Webhook sent successfully on attempt ${attempt}`)
        return // Success!
      } catch (error) {
        clearTimeout(timeoutId)
        lastError = error as Error
        console.error(`[WebhookProvider] Attempt ${attempt} failed for ${url}:`, (error as any).message)
        if (attempt < 3) {
           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff simple
        }
      }
    }

    throw lastError || new Error('Webhook failed after 3 attempts')
  }
}
