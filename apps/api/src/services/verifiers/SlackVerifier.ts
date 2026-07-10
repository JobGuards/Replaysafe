import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * Slack Verifier — Phase 7
 *
 * Confirms a Slack message was delivered by checking its timestamp (ts) via
 * conversations.history. Required config: { botToken: "xoxb-..." }
 * Receipt must contain: { timestamp: "1234567890.123456", channelId: "C0..." }
 *
 * Status mapping:
 *   message found in history → VERIFIED
 *   history returned but message absent → FAILED (SEMANTIC: message not found)
 *   API error / unreachable → UNKNOWN
 */
export class SlackVerifier implements VerifierProvider {
  readonly providerName = "slack";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { botToken } = config;
    if (!botToken) {
      console.warn("[SlackVerifier] No botToken in provider config. Skipping.");
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.timestamp || !receipt?.channelId)
      return { status: "UNKNOWN" };

    try {
      const res = await axios.get(
        "https://slack.com/api/conversations.history",
        {
          headers: { Authorization: `Bearer ${botToken}` },
          params: {
            channel: receipt.channelId,
            latest: receipt.timestamp,
            oldest: receipt.timestamp,
            inclusive: "true",
            limit: 1,
          },
          timeout: 8000,
        },
      );

      const data = res.data;
      if (!data.ok) {
        console.warn(`[SlackVerifier] Slack API error: ${data.error}`);
        return { status: "UNKNOWN" };
      }

      const messages: any[] = data.messages ?? [];
      const found = messages.some((m: any) => m.ts === receipt.timestamp);
      if (found) return { status: "VERIFIED" };
      return { status: "FAILED", failureType: "SEMANTIC" };
    } catch (err: any) {
      console.warn(`[SlackVerifier] Request error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
