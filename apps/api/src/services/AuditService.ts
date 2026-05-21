import { prisma } from '@replaysafe/db'

export type AuditAction = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'MONITOR_CREATE'
  | 'MONITOR_UPDATE'
  | 'MONITOR_DELETE'
  | 'PROJECT_CREATE'
  | 'PROJECT_DELETE'
  | 'ALERT_CHANNEL_CREATE'
  | 'ALERT_CHANNEL_DELETE'
  | 'API_KEY_CREATE'
  | 'API_KEY_DELETE'

export interface AuditLogOptions {
  userId?: string
  projectId?: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  async log(options: AuditLogOptions) {
    try {
      await (prisma as any).auditLog.create({
        data: {
          action: options.action,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          userId: options.userId,
          projectId: options.projectId,
          metadata: options.metadata || {},
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        },
      })
    } catch (error) {
      // We don't want to fail the main request if audit logging fails
      console.error('[AuditService] Failed to record audit log:', error)
    }
  }

  /**
   * Helper to log monitor changes
   */
  async logMonitorAction(
    action: 'MONITOR_CREATE' | 'MONITOR_UPDATE' | 'MONITOR_DELETE',
    monitor: any,
    userId?: string,
    metadata?: any
  ) {
    return this.log({
      action,
      resourceType: 'MONITOR',
      resourceId: monitor.id,
      userId,
      projectId: monitor.projectId,
      metadata,
    })
  }
}

export const auditService = new AuditService()
