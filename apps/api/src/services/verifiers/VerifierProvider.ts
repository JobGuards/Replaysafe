/**
 * Core interface for all Phase 7 provider verifiers.
 *
 * A verifier is a stateless adapter that takes a ledger entry whose status is
 * UNKNOWN and returns the confirmed outcome by querying the provider's API.
 */

export interface LedgerEntry {
  id: string;
  type: string;
  provider: string | null;
  /** The provider-native proof stored when the effect was committed. */
  receipt: Record<string, any> | null;
  fingerprint: string;
  target: string | null;
  executionId: string;
}

export type VerificationOutcome = "VERIFIED" | "FAILED" | "UNKNOWN";
export type FailureType = "TRANSIENT" | "SEMANTIC";

export interface VerificationResult {
  status: VerificationOutcome;
  failureType?: FailureType | null;
}

export interface VerifierProvider {
  /** Lower-case provider name (e.g. "stripe", "sendgrid"). Must match GuardSideEffect.provider. */
  readonly providerName: string;
  /**
   * Consult the provider's API to determine the real outcome of this effect.
   * - Return "VERIFIED" if the operation succeeded on the provider side.
   * - Return "FAILED" if the operation definitively failed (charge declined, email bounced, etc.), and classify the failureType.
   * - Return "UNKNOWN" if the check is inconclusive (rate-limited, API unreachable, no receipt).
   */
  verify(
    entry: LedgerEntry,
    providerConfig: Record<string, any>,
  ): Promise<VerificationResult>;
}
