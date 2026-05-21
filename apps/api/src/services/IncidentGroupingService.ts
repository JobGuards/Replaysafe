import { prisma } from '@replaysafe/db'

/**
 * PR #43: Smart Incident Grouping Service
 *
 * Groups related incidents together based on:
 * 1. Same monitor within 1 hour → likely same outage
 * 2. Multiple monitors, same time window → cascade failure
 */
export const incidentGroupingService = {
  /**
   * After creating a new incident, check if it should be grouped
   * with existing open incidents (same monitor within 1 hour).
   */
  async groupNewIncident(incidentId: string): Promise<void> {
    const incident = await (prisma as any).incident.findUnique({
      where: { id: incidentId },
    })
    if (!incident) return

    const oneHourAgo = new Date(incident.startedAt.getTime() - 60 * 60 * 1000)

    // Look for open incidents on the same monitor in the last hour
    const related = await (prisma as any).incident.findFirst({
      where: {
        monitorId: incident.monitorId,
        startedAt: { gte: oneHourAgo },
        resolvedAt: null,
        id: { not: incidentId },
      },
      orderBy: { startedAt: 'desc' },
    })

    if (related) {
      // If the related incident already has a group, join it
      if (related.groupId) {
        await (prisma as any).incident.update({
          where: { id: incidentId },
          data: { groupId: related.groupId },
        })
      } else {
        // Create a new group and link both incidents
        const group = await (prisma as any).incidentGroup.create({
          data: {
            title: `Outage cluster on monitor ${incident.monitorId}`,
            patternType: 'cascade',
          },
        })
        await (prisma as any).incident.updateMany({
          where: { id: { in: [incidentId, related.id] } },
          data: { groupId: group.id },
        })
      }
    }
  },

  /**
   * Detect cascade failures across multiple monitors (same project, same time window).
   * Run periodically (e.g., every 5 minutes).
   */
  async detectCascadeFailures(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const recentOpenIncidents = await (prisma as any).incident.findMany({
      where: {
        startedAt: { gte: fiveMinutesAgo },
        resolvedAt: null,
        groupId: null,
      },
      include: {
        monitor: { select: { projectId: true, name: true } },
      },
    }) as any[]

    // Group by projectId
    const byProject: Record<string, typeof recentOpenIncidents> = {}
    for (const inc of recentOpenIncidents) {
      const pid = inc.monitor.projectId
      if (!byProject[pid]) byProject[pid] = []
      byProject[pid].push(inc)
    }

    // If 2+ monitors in same project failed at the same time, create a cascade group
    for (const [projectId, incidents] of Object.entries(byProject)) {
      if (incidents.length >= 2) {
        const group = await (prisma as any).incidentGroup.create({
          data: {
            title: `Cascade failure across ${incidents.length} monitors`,
            description: `Monitors affected: ${incidents.map((i: any) => i.monitor.name).join(', ')}`,
            patternType: 'cascade',
          },
        })
        await (prisma as any).incident.updateMany({
          where: { id: { in: incidents.map((i: any) => i.id) } },
          data: { groupId: group.id },
        })
        console.log(`[IncidentGrouping] Created cascade group ${group.id} for project ${projectId}`)
      }
    }
  },
}
