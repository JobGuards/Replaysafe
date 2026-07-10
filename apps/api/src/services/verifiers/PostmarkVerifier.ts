import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * Postmark Verifier — Phase 7
 *
 * Confirms an email was sent via Postmark by checking the message status.
 * Required config: { serverToken: "POSTMARK_SERVER_TOKEN" }
 * Receipt must contain: { messageId: "postmark-message-id" }
 *
 * Status mapping:
 *   "Sent" / "Delivered" → VERIFIED
 *   "Bounced" / "SpamComplaint" / "OpenFailure" → FAILED (SEMANTIC: email rejected/bounced)
 *   "Processing" → UNKNOWN
 *   Not found → UNKNOWN (may not be indexed yet)
 */
export class PostmarkVerifier implements VerifierProvider {
  readonly providerName = "postmark";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { serverToken } = config;
    if (!serverToken) {
      console.warn(
        "[PostmarkVerifier] No serverToken in provider config. Skipping.",
      );
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.messageId) return { status: "UNKNOWN" };

    try {
      const res = await axios.get(
        `https://api.postmarkapp.com/messages/outbound/${receipt.messageId}/details`,
        {
          headers: {
            "X-Postmark-Server-Token": serverToken,
            Accept: "application/json",
          },
          timeout: 8000,
        },
      );

      const status = res.data?.Status?.toLowerCase() ?? "";
      if (status === "sent" || status === "delivered")
        return { status: "VERIFIED" };
      if (["bounced", "spamcomplaint", "openfailure"].includes(status)) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      return { status: "UNKNOWN" };
    } catch (err: any) {
      console.warn(`[PostmarkVerifier] API error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
