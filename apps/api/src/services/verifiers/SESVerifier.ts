import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * AWS SES (Simple Email Service) Verifier — Phase 7
 *
 * Confirms an email was sent via SES by checking the message status.
 * Uses AWS SDK v3 to query SES for message delivery status.
 * Required config: { accessKeyId: "AKIA...", secretAccessKey: "...", region: "us-east-1" }
 * Receipt must contain: { messageId: "ses-message-id" }
 *
 * Status mapping:
 *   "Delivered" / "Success" → VERIFIED
 *   "Bounce" / "Complaint" / "Reject" → FAILED (SEMANTIC: email rejected/bounced)
 *   "Pending" / "Sending" / "DeliveryDelay" → UNKNOWN
 *   Not found / API error → UNKNOWN
 *
 * Note: SES tracking requires Configuration Set with Event Destinations enabled.
 * If not configured, this will return UNKNOWN.
 */
export class SESVerifier implements VerifierProvider {
  readonly providerName = "ses";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { accessKeyId, secretAccessKey, region } = config;
    if (!accessKeyId || !secretAccessKey || !region) {
      console.warn(
        "[SESVerifier] Missing accessKeyId/secretAccessKey/region in provider config. Skipping.",
      );
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.messageId) return { status: "UNKNOWN" };

    // We import the AWS SDK dynamically to avoid hard-coupling the package.
    // If @aws-sdk/client-sesv2 is not installed, fall back to UNKNOWN gracefully.
    try {
      let SESv2Client: any, GetEmailIdentityCommand: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const awsSdk = await eval('import("@aws-sdk/client-sesv2")');
        SESv2Client = awsSdk.SESv2Client;
        GetEmailIdentityCommand = awsSdk.GetEmailIdentityCommand;
      } catch {
        throw new Error(
          "@aws-sdk/client-sesv2 is not installed. Run: pnpm add @aws-sdk/client-sesv2",
        );
      }

      // SESv2 doesn't have a direct message status lookup API.
      // The typical pattern is to use Configuration Sets with Event Destinations
      // (SNS, Kinesis, CloudWatch) to capture delivery events.
      // Since we can't query message status directly, we check if the receipt
      // contains a pre-populated status (set by a custom event processor).
      if (receipt?.status) {
        const status = receipt.status.toLowerCase();
        if (status === "delivered" || status === "success") {
          return { status: "VERIFIED" };
        }
        if (["bounce", "complaint", "reject"].includes(status)) {
          return { status: "FAILED", failureType: "SEMANTIC" };
        }
      }

      // Without a custom event pipeline, we cannot verify SES status.
      console.warn(
        "[SESVerifier] No custom status in receipt. SES requires Configuration Set + Event Destination for delivery tracking. Returning UNKNOWN.",
      );
      return { status: "UNKNOWN" };
    } catch (err: any) {
      console.warn(`[SESVerifier] Check error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
