import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * Stripe Verifier — Phase 7
 *
 * Checks receipt.chargeId or receipt.paymentIntentId against the Stripe API.
 * Required config: { secretKey: "sk_live_..." }
 *
 * Status mapping:
 *   charge.status === "succeeded"          → VERIFIED
 *   charge.status === "failed"             → FAILED (SEMANTIC: card declined)
 *   paymentIntent.status === "succeeded"   → VERIFIED
 *   paymentIntent.status in failing set    → FAILED (SEMANTIC: canceled/requires_method)
 *   anything else / API unreachable        → UNKNOWN
 */
export class StripeVerifier implements VerifierProvider {
  readonly providerName = "stripe";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { secretKey } = config;
    if (!secretKey) {
      console.warn("[StripeVerifier] No secretKey in provider config. Skipping.");
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt) return { status: "UNKNOWN" };

    const headers = {
      Authorization: `Bearer ${secretKey}`,
    };

    try {
      // Try charge lookup first, then paymentIntent
      if (receipt.chargeId) {
        const res = await axios.get(
          `https://api.stripe.com/v1/charges/${receipt.chargeId}`,
          { headers, timeout: 8000 },
        );
        const status: string = res.data?.status;
        if (status === "succeeded") return { status: "VERIFIED" };
        if (status === "failed") {
          return { status: "FAILED", failureType: "SEMANTIC" };
        }
        return { status: "UNKNOWN" };
      }

      if (receipt.paymentIntentId) {
        const res = await axios.get(
          `https://api.stripe.com/v1/payment_intents/${receipt.paymentIntentId}`,
          { headers, timeout: 8000 },
        );
        const status: string = res.data?.status;
        if (status === "succeeded") return { status: "VERIFIED" };
        if (["canceled", "requires_payment_method"].includes(status)) {
          return { status: "FAILED", failureType: "SEMANTIC" };
        }
        return { status: "UNKNOWN" };
      }

      // No recognisable receipt key
      return { status: "UNKNOWN" };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      console.warn(`[StripeVerifier] API error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
