import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * AWS S3 Verifier — Phase 7
 *
 * Confirms an object was successfully written to S3 by performing a HeadObject check.
 * Required config: { accessKeyId: "AKIA...", secretAccessKey: "...", region: "us-east-1" }
 * Receipt must contain: { bucket: "my-bucket", key: "path/to/object.json" }
 *
 * Uses the AWS REST API directly (no AWS SDK dependency) via a presigned-style HEAD request.
 * This avoids adding a heavy SDK as a dependency.
 *
 * Status mapping:
 *   HEAD 200 → VERIFIED
 *   HEAD 404 → FAILED (SEMANTIC: object not found in bucket)
 *   any other error → UNKNOWN
 */
export class S3Verifier implements VerifierProvider {
  readonly providerName = "s3";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { accessKeyId, secretAccessKey, region } = config;
    if (!accessKeyId || !secretAccessKey || !region) {
      console.warn(
        "[S3Verifier] Missing accessKeyId/secretAccessKey/region in provider config. Skipping.",
      );
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt?.bucket || !receipt?.key) return { status: "UNKNOWN" };

    // We import the AWS SDK dynamically to avoid hard-coupling the package.
    // If @aws-sdk/client-s3 is not installed, fall back to UNKNOWN gracefully.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let S3Client: any, HeadObjectCommand: any;
      try {
        // Dynamic require — intentionally untyped to avoid compile-time dep on the SDK
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const awsSdk = await eval('import("@aws-sdk/client-s3")');
        S3Client = awsSdk.S3Client;
        HeadObjectCommand = awsSdk.HeadObjectCommand;
      } catch {
        throw new Error(
          "@aws-sdk/client-s3 is not installed. Run: pnpm add @aws-sdk/client-s3",
        );
      }

      const client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      await client.send(
        new HeadObjectCommand({ Bucket: receipt.bucket, Key: receipt.key }),
      );
      return { status: "VERIFIED" };
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      console.warn(`[S3Verifier] Check error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
