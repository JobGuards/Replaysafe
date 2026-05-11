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
   */
  static async verifySideEffect(
    executionId: string,
    fingerprint: string,
    type: string,
    target: string,
    inputHash: string
  ) {
    const currentExecution = await prisma.guardExecution.findUnique({
      where: { id: executionId },
    });

    if (!currentExecution) {
      throw new Error("Execution not found");
    }

    // Check if this fingerprint exists in any attempt of the same job
    if (currentExecution.externalId) {
      const priorEffect = await prisma.guardSideEffect.findFirst({
        where: {
          fingerprint,
          execution: {
            externalId: currentExecution.externalId,
            monitorId: currentExecution.monitorId,
            // We consider it valid if it was completed in any previous run
          },
        },
        orderBy: {
          executedAt: "desc"
        }
      });

      if (priorEffect) {
        return { 
          action: "SKIP", 
          cachedResult: priorEffect.metadata || { message: "Already executed successfully" } 
        };
      }
    }

    // Record this side effect as part of the current execution
    await prisma.guardSideEffect.create({
      data: {
        executionId,
        fingerprint,
        type,
        target,
        inputHash,
        status: "COMPLETED",
      },
    });

    return { action: "EXECUTE" };
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
