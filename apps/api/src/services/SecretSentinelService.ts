import { prisma } from "@replaysafe/db";
import { subDays, isBefore, addDays } from "date-fns";

function log(msg: string) {
  // Logging disabled
}

export interface SecretRisk {
  type: "EXPIRING_SOON" | "STALE_VERSION" | "SUSPICIOUS_ROTATION";
  secretName: string;
  description: string;
  expiryDate?: Date;
}

export class SecretSentinelService {
  /**
   * Scan project side-effects for potential secret risks
   */
  async scanProject(projectId: string): Promise<SecretRisk[]> {
    log(`Scanning project: ${projectId}`);
    // Scan side effects from the last 7 days
    const cutoff = subDays(new Date(), 7);
    const sideEffects = await (prisma as any).guardSideEffect.findMany({
      where: {
        projectId,
        executedAt: { gte: cutoff },
        metadata: { not: null },
      },
      select: { metadata: true, target: true, type: true },
    });

    log(`Found ${sideEffects.length} side-effects with metadata`);
    const risks: SecretRisk[] = [];
    const now = new Date();
    const warningWindow = addDays(now, 7); // 7 days warning

    for (const se of sideEffects) {
      const metadata = se.metadata as any;

      // 1. Check for expiration fields
      const expiryFields = ["expires_at", "expiry", "exp", "valid_until"];
      for (const field of expiryFields) {
        if (metadata[field]) {
          const expiry = new Date(metadata[field]);
          if (!isNaN(expiry.getTime()) && isBefore(expiry, warningWindow)) {
            log(
              `RISK DETECTED: ${se.target} expires on ${expiry.toISOString()}`,
            );
            risks.push({
              type: "EXPIRING_SOON",
              secretName: se.target || "Unknown Secret",
              description: `Secret detected in ${se.type} call to ${se.target} is expiring on ${expiry.toLocaleDateString()}.`,
              expiryDate: expiry,
            });
            break; // Only one risk per side effect for now
          }
        }
      }

      // 2. Check for versioning (if a very old version is being used)
      if (metadata["version"] || metadata["key_id"]) {
        // This would ideally compare against a "latest known version"
        // For now, we flag if it's explicitly marked as 'deprecated' in metadata
        if (metadata["is_deprecated"] === true) {
          log(`RISK DETECTED (Deprecated): ${se.target}`);
          risks.push({
            type: "STALE_VERSION",
            secretName: se.target || "Unknown Secret",
            description: `A deprecated secret version was used in a call to ${se.target}.`,
          });
        }
      }
    }

    return risks;
  }

  /**
   * Run a global scan and update FailurePatterns for security monitoring
   */
  async runSecurityAudit(projectId: string): Promise<void> {
    const allRisks = await this.scanProject(projectId);
    // Deduplicate risks by type and target secret
    const uniqueRisksMap = new Map<string, SecretRisk>();
    for (const r of allRisks) {
      const key = `${r.type}:${r.secretName}`;
      if (!uniqueRisksMap.has(key)) {
        uniqueRisksMap.set(key, r);
      }
    }
    const risks = Array.from(uniqueRisksMap.values());

    log(`Audit finished for ${projectId}. Unique risks found: ${risks.length}`);

    // First, clear old security risks for this project
    // We'll use a special 'monitorId' or a generic project-level monitor for security audits
    // Or we can attach them to the specific monitors where they occurred.
    // For simplicity, let's group them by the target (the secret source).

    for (const risk of risks) {
      // Find the monitor that most recently used this secret
      const lastSe = await (prisma as any).guardSideEffect.findFirst({
        where: { projectId, target: risk.secretName },
        orderBy: { executedAt: "desc" },
        select: { execution: { select: { monitorId: true } } },
      });

      if (lastSe?.execution?.monitorId) {
        const monitorId = lastSe.execution.monitorId;
        const existing = await (prisma as any).failurePattern.findFirst({
          where: {
            monitorId,
            type: "SECRET_RISK",
            metadata: {
              path: ["path"],
              equals: risk.secretName,
            } as any,
            active: true,
          },
        });

        if (!existing) {
          await (prisma as any).failurePattern.create({
            data: {
              monitorId,
              type: "SECRET_RISK",
              description: `[SECURITY] ${risk.description}`,
              confidence: 1.0,
              active: true,
              metadata: {
                riskType: risk.type,
                expiryDate: risk.expiryDate,
                path: risk.secretName, // Added for deduplication
              },
            },
          });
        }
      }
    }
  }
}

export const secretSentinelService = new SecretSentinelService();
