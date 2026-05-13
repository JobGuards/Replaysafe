import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GuardsService {
  /**
   * Initializes a new guarded execution session.
   * If externalId is provided, it detects if this is a retry and increments the attempt counter.
   */
  static async createSession(monitorId: string, projectId: string, externalId?: string) {
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new Error("Monitor not found");
    }

    if (monitor.projectId !== projectId) {
      throw new Error("Unauthorized: Monitor does not belong to this project");
    }

    let attempt = 1;
    if (externalId) {
      const lastExecution = await prisma.guardExecution.findFirst({
        where: { externalId, monitorId },
        orderBy: { attempt: "desc" },
      });
      if (lastExecution) {
        attempt = lastExecution.attempt + 1;
      }
    }

    const execution = await prisma.guardExecution.create({
      data: {
        monitorId,
        externalId,
        attempt,
        status: "RUNNING",
      },
    });

    return {
      ...execution,
      retryPolicy: monitor.retryPolicy,
    };
  }

  /**
   * Verifies if a side effect has already been successfully executed in a previous attempt.
   * Now supports project-wide deduplication and state snapshot drift detection.
   */
  static async verifySideEffect(
    executionId: string,
    fingerprint: string,
    type: string,
    target: string,
    inputHash: string,
    metadata: any = null,
    scope: "MONITOR" | "PROJECT" = "MONITOR"
  ) {
    const currentExecution = await prisma.guardExecution.findUnique({
      where: { id: executionId },
      include: { monitor: true }
    });

    if (!currentExecution) {
      throw new Error("Execution not found");
    }

    const projectId = currentExecution.monitor.projectId;

    // Handle State Snapshots (Phase 2)
    if (type === "STATE_SNAPSHOT") {
      let driftDetected = false;
      if (currentExecution.externalId) {
        const lastSnapshot = await prisma.guardSideEffect.findFirst({
          where: {
            type: "STATE_SNAPSHOT",
            target, // The snapshot key
            projectId,
            execution: {
              externalId: currentExecution.externalId,
              monitorId: currentExecution.monitorId,
            }
          },
          orderBy: { executedAt: "desc" }
        });

        if (lastSnapshot && lastSnapshot.inputHash !== inputHash) {
          driftDetected = true;
        }
      }

      await prisma.guardSideEffect.create({
        data: {
          executionId,
          projectId,
          fingerprint,
          type,
          target,
          inputHash,
          status: "COMPLETED",
          metadata: { 
            ...(metadata || {}),
            driftDetected,
            previousHash: driftDetected ? "mismatch" : "consistent"
          }
        }
      });

      return { action: "EXECUTE" as const };
    }

    // Deduplication Logic
    const searchCriteria: any = {
      fingerprint,
      status: "COMPLETED",
    };

    if (scope === "PROJECT") {
      searchCriteria.projectId = projectId;
    } else {
      // For MONITOR scope, we look for matches in the current execution OR previous attempts of the same job
      if (currentExecution.externalId) {
        searchCriteria.execution = {
          externalId: currentExecution.externalId,
          monitorId: currentExecution.monitorId
        };
      } else {
        searchCriteria.executionId = executionId;
      }
    }

    const priorEffect = await prisma.guardSideEffect.findFirst({
      where: searchCriteria,
      orderBy: { executedAt: "desc" }
    });

    if (priorEffect) {
      // Phase 2: If this is the current execution reporting its result, update the metadata
      if (priorEffect.executionId === executionId) {
        await prisma.guardSideEffect.update({
          where: { id: priorEffect.id },
          data: { metadata: { ...(typeof priorEffect.metadata === 'object' ? (priorEffect.metadata as any) : {}), ...metadata } }
        });
        return { action: "EXECUTE" as const };
      }

      // Record that we skipped this in the current execution for visibility
      await prisma.guardSideEffect.create({
        data: {
          executionId,
          projectId,
          fingerprint,
          type,
          target,
          inputHash,
          status: "SKIPPED",
          metadata: { 
            originalExecutionId: priorEffect.executionId,
            message: `Bypassed via ${scope === "PROJECT" ? "Global" : "Execution"} Memory`
          }
        },
      });

      return { 
        action: "SKIP" as const, 
        cachedResult: priorEffect.metadata || { message: "Already executed successfully" } 
      };
    }

    // Record this side effect as part of the current execution
    try {
      await prisma.guardSideEffect.create({
        data: {
          executionId,
          projectId,
          fingerprint,
          type,
          target,
          inputHash,
          status: "COMPLETED",
          metadata
        },
      });
    } catch (error: any) {
      // Handle P2002 (Unique constraint failed) - this means another thread/process 
      // just registered this side effect. We should treat it as a SKIP.
      if (error.code === 'P2002') {
        const raceEffect = await prisma.guardSideEffect.findFirst({
          where: searchCriteria,
          orderBy: { executedAt: "desc" }
        });
        
        return { 
          action: "SKIP" as const, 
          cachedResult: raceEffect?.metadata || { message: "Already executed (race condition handled)" } 
        };
      }
      throw error;
    }

    return { action: "EXECUTE" as const };
  }

  /**
   * Registers a rollback action for a specific side effect.
   */
  static async registerRollback(
    executionId: string,
    fingerprint: string,
    type: string,
    target: string,
    payload: any = null
  ) {
    const sideEffect = await prisma.guardSideEffect.findUnique({
      where: { executionId_fingerprint: { executionId, fingerprint } }
    });

    if (!sideEffect) {
      throw new Error("Side effect not found for rollback registration");
    }

    return await prisma.guardRollback.create({
      data: {
        executionId,
        sideEffectId: sideEffect.id,
        type,
        target,
        payload,
        status: "PENDING",
      }
    });
  }

  /**
   * Finalizes the execution status. 
   * If FAILED, it optionally triggers all registered rollbacks.
   */
  static async completeExecution(executionId: string, status: "SUCCESS" | "FAILED", shouldRollback: boolean = false) {
    const execution = await prisma.guardExecution.update({
      where: { id: executionId },
      data: {
        status,
        finishedAt: new Date(),
      },
    });

    let triggeredRollbacks: any[] = [];
    if (status === "FAILED" && shouldRollback) {
      triggeredRollbacks = await this.triggerRollbacks(executionId);
    }

    return {
      ...execution,
      rollbacks: triggeredRollbacks
    };
  }

  /**
   * Triggers all registered rollbacks for an execution.
   * Returns the list of rollbacks that were triggered.
   */
  static async triggerRollbacks(executionId: string) {
    const rollbacks = await prisma.guardRollback.findMany({
      where: { executionId, status: "PENDING" },
      include: { sideEffect: true }
    });

    console.log(`[ReplayGuard] Triggering ${rollbacks.length} rollbacks for execution ${executionId}`);

    for (const rb of rollbacks) {
      try {
        // Here we would actually execute the rollback logic (e.g., HTTP call)
        // For now, we mark them as COMPLETED to simulate the effect.
        await prisma.guardRollback.update({
          where: { id: rb.id },
          data: {
            status: "COMPLETED",
            executedAt: new Date(),
          }
        });
        console.log(`[ReplayGuard] Rollback COMPLETED for ${rb.sideEffect.target} (${rb.type})`);
      } catch (error: any) {
        console.error(`[ReplayGuard] Rollback FAILED for ${rb.id}:`, error.message);
        await prisma.guardRollback.update({
          where: { id: rb.id },
          data: {
            status: "FAILED",
            error: error.message
          }
        });
      }
    }
    return rollbacks;
  }

  /**
   * Fetches all guarded executions for a specific project.
   */
  static async listExecutions(projectId: string) {
    return await prisma.guardExecution.findMany({
      where: {
        monitor: {
          projectId,
        },
      },
      include: {
        monitor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            sideEffects: true,
            rollbacks: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 50,
    });
  }

  /**
   * Fetches detailed information for a single execution, including side effects and rollbacks.
   */
  static async getExecutionDetails(executionId: string, projectId: string) {
    const execution = await prisma.guardExecution.findUnique({
      where: { id: executionId },
      include: {
        monitor: true,
        sideEffects: {
          orderBy: {
            executedAt: "asc",
          },
          include: {
            rollback: true
          }
        },
        rollbacks: true,
      },
    });

    if (!execution || execution.monitor.projectId !== projectId) {
      return null;
    }

    return execution;
  }
}
