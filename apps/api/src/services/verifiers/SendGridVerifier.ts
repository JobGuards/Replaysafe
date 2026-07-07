import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * SendGrid Verifier — Phase 7
 *
 * Checks receipt.messageId via SendGrid Email Activity API.
 * Required config: { apiKey: "SG.xxx" }
 *
 * Note: SendGrid's activity feed has a ~5 minute indexing delay. Effects
 * verified within 5 minutes of sending may return UNKNOWN and resolve on
 * the next verification cycle.
 *
 * Status mapping:
 *   event "delivered" found  → VERIFIED
 *   event "bounce" / "drop" found → FAILED (SEMANTIC: email rejected/bounced)
 *   no events found / unreachable → UNKNOWN
 */
export class SendGridVerifier implements VerifierProvider {
  readonly providerName = "sendgrid";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { apiKey } = config;
    if (!apiKey) {
      console.warn("[SendGridVerifier] No apiKey in provider config. Skipping.");
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.messageId) return { status: "UNKNOWN" };

    try {
      const res = await axios.get(
        `https://api.sendgrid.com/v3/messages?limit=10&query=msg_id="${receipt.messageId}"`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        },
      );

      const messages: any[] = res.data?.messages ?? [];
      if (messages.length === 0) return { status: "UNKNOWN" }; // not indexed yet

      const status = messages[0]?.status?.toLowerCase() ?? "";
      if (status === "delivered") return { status: "VERIFIED" };
      if (["bounced", "blocked", "dropped", "spam_report"].includes(status)) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      return { status: "UNKNOWN" };
    } catch (err: any) {
      console.warn(`[SendGridVerifier] API error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
