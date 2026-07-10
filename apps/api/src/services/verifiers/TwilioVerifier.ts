import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * Twilio Verifier — Phase 7
 *
 * Confirms an SMS/WhatsApp message was delivered by checking its SID.
 * Required config: { accountSid: "AC...", authToken: "..." }
 * Receipt must contain: { messageSid: "SM..." }
 *
 * Status mapping:
 *   message.status === "delivered" → VERIFIED
 *   message.status in failing set  → FAILED (SEMANTIC: delivery failed)
 *   message.status === "sent"      → UNKNOWN (in-transit, check later)
 *   API unreachable                → UNKNOWN
 */
export class TwilioVerifier implements VerifierProvider {
  readonly providerName = "twilio";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { accountSid, authToken } = config;
    if (!accountSid || !authToken) {
      console.warn(
        "[TwilioVerifier] Missing accountSid/authToken in provider config. Skipping.",
      );
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.messageSid) return { status: "UNKNOWN" };

    try {
      const res = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${receipt.messageSid}.json`,
        {
          auth: { username: accountSid, password: authToken },
          timeout: 8000,
        },
      );

      const status: string = res.data?.status ?? "";
      if (status === "delivered") return { status: "VERIFIED" };
      if (["failed", "undelivered"].includes(status)) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      // "sent", "queued", "sending" are intermediate states — try again next cycle
      return { status: "UNKNOWN" };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      console.warn(`[TwilioVerifier] API error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
