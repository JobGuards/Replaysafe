import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay
// If env vars are missing, we log a warning but don't fail immediately to allow the app to boot
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set in environment variables.');
  }

  return new Razorpay({
    key_id: keyId || 'fake_key_id',
    key_secret: keySecret || 'fake_key_secret',
  });
};

const PLAN_PRICES: Record<string, number> = {
  basic: 200,      // ₹299.00 in paise
  premium: 400,    // ₹999.00 in paise
  enterprise: 500, // ₹4999.00 in paise
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId } = body;

    const amount = PLAN_PRICES[planId];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'fake_key_id',
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
