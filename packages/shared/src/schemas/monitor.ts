import { z } from 'zod'

export const ScheduleTypeEnum = z.enum(['CRON', 'SIMPLE'])

export const createMonitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'Schedule is required'),
  scheduleType: ScheduleTypeEnum.default('CRON'),
  graceSeconds: z.number().int().min(0).default(300),
  timezone: z.string().default('UTC'),
  alertOnLate: z.boolean().default(true),
  notifyAfterSeconds: z.number().int().min(0).default(0),
})

export const updateMonitorSchema = createMonitorSchema.partial()

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>

export interface MonitorResponse {
  id: string
  name: string
  description: string | null
  schedule: string
  scheduleType: 'CRON' | 'SIMPLE'
  graceSeconds: number
  timezone: string
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED'
  heartbeatToken: string
  enabled: boolean
  lastHeartbeatAt: string | null
  nextExpectedAt: string | null
  createdAt: string
  updatedAt: string
}
