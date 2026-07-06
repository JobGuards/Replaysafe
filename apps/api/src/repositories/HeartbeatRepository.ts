import { prisma, HeartbeatType, MonitorStatus } from "@replaysafe/db";

export class HeartbeatRepository {
  /**
   * Record a new heartbeat and update monitor status
   */
  async record(data: {
    type: HeartbeatType;
    monitorId: string;
    duration?: number;
    exitCode?: number;
    output?: string;
    latency?: number;
    handshakeAge?: number;
    isLate?: boolean;
    region?: string;
  }) {
    const { monitorId, type, isLate, ...rest } = data;

    // Determine new monitor status
    const status = type === "SUCCESS" ? MonitorStatus.UP : MonitorStatus.DOWN;

    // Use a transaction to ensure atomic update of monitor and heartbeat record
    return (prisma as any).$transaction(async (tx: any) => {
      // 1. Create heartbeat
      const heartbeat = await tx.heartbeat.create({
        data: {
          monitorId,
          type,
          isLate,
          ...rest,
        },
      });

      // 2. Update monitor
      const monitor = await tx.monitor.update({
        where: { id: monitorId },
        data: {
          lastHeartbeatAt: new Date(),
          status,
          totalHeartbeats: { increment: 1 },
          // Reset consecutiveFailures on success, increment on failure
          consecutiveFailures: type === "SUCCESS" ? 0 : { increment: 1 },
        },
      });

      return { heartbeat, monitor };
    });
  }

  /**
   * Get heartbeat history for a monitor
   */
  async getHistory(monitorId: string, limit: number = 50) {
    return prisma.heartbeat.findMany({
      where: {
        monitorId,
        deletedAt: null,
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: limit,
    });
  }

  /**
   * Find a heartbeat by id
   */
  async findById(id: string) {
    return prisma.heartbeat.findUnique({
      where: { id },
    });
  }
}

export const heartbeatRepository = new HeartbeatRepository();
