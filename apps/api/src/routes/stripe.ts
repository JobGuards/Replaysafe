import { Router, Request, Response } from 'express'
import { prisma } from '@replaysafe/db'
import { authMiddleware } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

/**
 * POST /api/stripe/checkout
 * Create a checkout session for a project upgrade
 */
router.post('/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId, plan } = req.body
    
    // In a real app, you would:
    // 1. Initialize Stripe: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    // 2. Create session: const session = await stripe.checkout.sessions.create(...)
    
    // For this skeleton, we'll return a mock URL
    res.json({ url: 'https://checkout.stripe.com/pay/mock_session_123' })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/stripe/webhook
 * Handle Stripe subscription events with webhook signature verification.
 * Protects against fake events from unauthorized sources.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const stripeSignature = req.headers['stripe-signature'] as string
    if (!stripeSignature) {
      return res.status(401).json({ error: 'Missing Stripe signature' })
    }

    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return res.status(500).json({ error: 'Webhook secret not configured' })
    }

    // Verify signature using raw body (Buffer captured before JSON parsing)
    let rawBody: Buffer | string = (req as any).rawBody
    if (Buffer.isBuffer(rawBody)) {
      rawBody = rawBody.toString('utf8')
    }
    if (!rawBody) {
      return res.status(400).json({ error: 'Unable to read request body for signature verification' })
    }
    const expectedSignature = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    const receivedSignatures = stripeSignature
      .split(',')
      .map(s => s.trim())
      .filter(s => s.startsWith('v1='))
      .map(s => s.slice(3))

    const isValid = receivedSignatures.some(sig => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(sig, 'hex')
        )
      } catch { return false }
    })

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Stripe signature' })
    }

    const event = req.body

    // Example logic for subscription update
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object
      const customerId = subscription.customer
      const plan = subscription.metadata.plan || 'PRO'

      await (prisma as any).project.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan },
      })
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

export default router
