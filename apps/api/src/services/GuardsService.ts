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

    return await prisma.guardExecution.create({
      data: {
        monitorId,
        externalId,
        attempt,
        status: "RUNNING",
      },
    });
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

    return { action: "EXECUTE" as const };
  }

  /**
   * Finalizes the execution status.
   */
  static async completeExecution(executionId: string, status: "SUCCESS" | "FAILED") {
    return await prisma.guardExecution.update({
      where: { id: executionId },
      data: {
        status,
        finishedAt: new Date(),
      },
    });
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
   * Fetches detailed information for a single execution, including side effects.
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
        },
      },
    });

    if (!execution || execution.monitor.projectId !== projectId) {
      return null;
    }

    return execution;
  }
}
