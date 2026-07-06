import { prisma } from "@replaysafe/db";
import { alertService } from "./AlertService.js";
import { selfHealingService } from "./SelfHealingService.js";

export class IncidentService {
  /**
   * Create a new incident for a monitor
   */
  async createIncident(monitorId: string, type: "missed" | "failed" | "late") {
    // Check if there is already an open incident for this monitor to prevent duplicates
    const openIncident = await (prisma.incident as any).findFirst({
      where: {
        monitorId,
        resolvedAt: null,
      },
    });

    if (openIncident) {
      return openIncident;
    }

    const incident = await (prisma.incident as any).create({
      data: {
        monitorId,
        type,
      },
      include: {
        monitor: true,
      },
    });

    // Trigger alerting
    alertService.sendIncidentAlert(incident).catch((err) => {
      console.error("[IncidentService] Failed to send incident alert:", err);
    });

    // Phase 5: Trigger self-healing
    selfHealingService.attemptHeal(monitorId, incident.id).catch((err) => {
      console.error("[IncidentService] Self-healing attempt failed:", err);
    });

    return incident;
  }

  /**
   * Resolve an incident manually
   */
  async resolveIncident(incidentId: string, notes?: string) {
    const incident = await (prisma.incident as any).update({
      where: { id: incidentId },
      data: {
        resolvedAt: new Date(),
        resolutionNotes: notes,
      },
    });

    // Trigger alerting
    alertService.sendResolutionAlert(incident).catch((err) => {
      console.error("[IncidentService] Failed to send resolution alert:", err);
    });

    return incident;
  }

  /**
   * Auto-resolve all open incidents for a monitor
   */
  async autoResolve(monitorId: string) {
    const openIncidents = await (prisma.incident as any).findMany({
      where: {
        monitorId,
        resolvedAt: null,
      },
    });

    if (openIncidents.length === 0) return;

    const result = await (prisma.incident as any).updateMany({
      where: {
        monitorId,
        resolvedAt: null,
      },
      data: {
        resolvedAt: new Date(),
        autoResolved: true,
        resolutionNotes: "Auto-resolved on monitor recovery.",
      },
    });

    // Trigger alerts for each resolved incident
    for (const incident of openIncidents) {
      alertService.sendResolutionAlert(incident).catch((err) => {
        console.error(
          "[IncidentService] Failed to send resolution alert:",
          err,
        );
      });
    }

    return result;
  }

  /**
   * Get all open incidents for a project
   */
  async getOpenIncidents(projectId: string) {
    return (prisma.incident as any).findMany({
      where: {
        monitor: {
          projectId,
        },
        resolvedAt: null,
      },
      include: {
        monitor: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
  }
}

export const incidentService = new IncidentService();
