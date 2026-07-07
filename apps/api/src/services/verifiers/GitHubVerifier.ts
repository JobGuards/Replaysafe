import axios from "axios";
import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * GitHub Verifier — Phase 7
 *
 * Confirms that a GitHub issue or PR created by the side effect actually exists.
 * Required config: { token: "ghp_...", owner: "org-or-user", repo: "repository" }
 * Receipt must contain: { issueNumber: 42 } or { prNumber: 7 }
 *
 * Status mapping:
 *   resource exists (200) → VERIFIED
 *   resource not found (404) → FAILED (SEMANTIC: issue/PR does not exist)
 *   API unreachable → UNKNOWN
 */
export class GitHubVerifier implements VerifierProvider {
  readonly providerName = "github";

  async verify(
    entry: LedgerEntry,
    config: Record<string, any>,
  ): Promise<VerificationResult> {
    const { token, owner, repo } = config;
    if (!token || !owner || !repo) {
      console.warn(
        "[GitHubVerifier] Missing token/owner/repo in provider config. Skipping.",
      );
      return { status: "UNKNOWN" };
    }

    const receipt = entry.receipt;
    if (!receipt) return { status: "UNKNOWN" };

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    try {
      let url: string | null = null;
      if (receipt.issueNumber) {
        url = `https://api.github.com/repos/${owner}/${repo}/issues/${receipt.issueNumber}`;
      } else if (receipt.prNumber) {
        url = `https://api.github.com/repos/${owner}/${repo}/pulls/${receipt.prNumber}`;
      }

      if (!url) return { status: "UNKNOWN" };

      await axios.get(url, { headers, timeout: 8000 });
      return { status: "VERIFIED" };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return { status: "FAILED", failureType: "SEMANTIC" };
      }
      console.warn(`[GitHubVerifier] API error: ${err.message}`);
      return { status: "UNKNOWN" };
    }
  }
}
