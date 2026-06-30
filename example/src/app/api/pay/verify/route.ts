import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withReplayGuard } from '@replaysafe/guard-sdk';

const PLAN_PRICES: Record<string, number> = {
  basic: 200,
  premium: 400,
  enterprise: 500,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      simulateCrash,
      attemptNumber = 1,
    } = body;

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret) {
      const generated_signature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    } else {
      console.warn('RAZORPAY_KEY_SECRET is not set. Skipping signature verification (simulation mode).');
    }

    console.log(`[VERIFY] Initiating verify for order ${razorpay_order_id}, attempt #${attemptNumber}`);

    // Wrap the fulfillment logic in ReplayGuard to prevent duplicate delivery
    const result = await withReplayGuard(
      {
        apiKey: process.env.REPLAYSAFE_API_KEY || 'sk_test_dev',
        monitorId: process.env.REPLAYSAFE_MONITOR_ID || 'razorpay-payments',
        baseUrl: process.env.REPLAYSAFE_API_URL || 'http://localhost:4040',
        debug: true,
      },
      async (guard) => {
        // Run fulfillment side effect inside the guard
        const fulfillmentResult = await guard.wrap(
          'ORDER_FULFILLMENT',
          razorpay_order_id,
          {
            paymentId: razorpay_payment_id,
            planId,
            amount: PLAN_PRICES[planId] || 0,
          },
          async () => {
            // This is the critical side effect that should run EXACTLY ONCE
            console.log(`[EXECUTE_SIDE_EFFECT] Fulfilling order ${razorpay_order_id} (Credits Provisioning)`);

            // Return dummy db record/fulfillment payload
            return {
              status: 'COMPLETED',
              creditsAdded: planId === 'basic' ? 100 : planId === 'premium' ? 500 : 3000,
              provisionedAt: new Date().toISOString(),
              paymentId: razorpay_payment_id,
            };
          }
        );

        // Register a compensation callback to run if subsequent steps fail
        await guard.compensate(
          'ORDER_FULFILLMENT',
          razorpay_order_id,
          { paymentId: razorpay_payment_id },
          {
            type: 'REVOKE_CREDITS',
            target: razorpay_order_id,
            payload: { paymentId: razorpay_payment_id },
          }
        );

        // Simulate crash if requested on the first attempt
        if (simulateCrash && attemptNumber === 1) {
          console.log('[SIMULATED_CRASH] Threw simulated crash post-fulfillment!');
          throw new Error('Simulated database/server crash post-fulfillment');
        }

        return {
          success: true,
          fulfillment: fulfillmentResult,
          message: 'Order verified and fulfilled successfully',
        };
      },
      {
        // Use order ID as execution ID / externalId to track across retries
        externalId: razorpay_order_id,
        onRollback: async (action) => {
          console.log(`[ROLLBACK_TRIGGERED] ReplayGuard compensation executed:`, action);
        },
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error during verification:', error);
    return NextResponse.json(
      {
        error: error.message || 'Verification failed',
        // Return order ID so client can retry with same details
        orderId: (await req.clone().json().catch(() => ({}))).razorpay_order_id,
      },
      { status: 500 }
    );
  }
}
