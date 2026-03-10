import { prisma } from '@stillup/db'
import { CreateMonitorInput, UpdateMonitorInput } from '../validators/monitor.js'
import crypto from 'crypto'

export class MonitorRepository {
  /**
   * Create a new monitor
   */
  async create(data: CreateMonitorInput & { projectId: string }) {
    const heartbeatToken = crypto.randomBytes(16).toString('hex')

    return (prisma.monitor as any).create({
      data: {
        ...data,
        heartbeatToken,
      },
    })
  }

  /**
   * Find a monitor by heartbeat token
   */
  async findByToken(heartbeatToken: string) {
    return (prisma.monitor as any).findUnique({
      where: { heartbeatToken },
    })
  }

  /**
   * Find a monitor by ID and project ID
   */
  async findById(id: string, projectId: string) {
    return (prisma.monitor as any).findFirst({
      where: {
        id,
        projectId,
        deletedAt: null,
      },
    })
  }

  /**
   * Find all monitors for a project
   */
  async findAll(projectId: string) {
    return (prisma.monitor as any).findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Update a monitor
   */
  async update(id: string, projectId: string, data: UpdateMonitorInput) {
    // We use updateMany to ensure we only update if it belongs to the project
    // and is not deleted, though update() is usually preferred if we have the ID.
    // However, for multi-tenancy, a check is safer.
    const monitor = await this.findById(id, projectId)
    if (!monitor) return null

    return (prisma.monitor as any).update({
      where: { id },
      data,
    })
  }

  /**
   * Soft delete a monitor
   */
  async delete(id: string, projectId: string) {
    const monitor = await this.findById(id, projectId)
    if (!monitor) return null

    return (prisma.monitor as any).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        enabled: false,
      },
    })
  }
}

export const monitorRepository = new MonitorRepository()
