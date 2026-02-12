import { z } from 'zod'

/**
 * Monitor creation validation schema
 */
export const createMonitorSchema = z.object({
  name: z
    .string()
    .min(1, 'Monitor name is required')
    .max(100, 'Monitor name must be less than 100 characters')
    .trim(),
  intervalMinutes: z
    .number()
    .int('Interval must be a whole number')
    .min(1, 'Interval must be at least 1 minute')
    .max(10080, 'Interval must be less than 7 days (10080 minutes)'),
  gracePeriodMinutes: z
    .number()
    .int('Grace period must be a whole number')
    .min(0, 'Grace period cannot be negative')
    .max(1440, 'Grace period must be less than 24 hours (1440 minutes)')
    .default(5),
})

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>

/**
 * Monitor update validation schema
 * All fields are optional for partial updates
 */
export const updateMonitorSchema = z.object({
  name: z
    .string()
    .min(1, 'Monitor name cannot be empty')
    .max(100, 'Monitor name must be less than 100 characters')
    .trim()
    .optional(),
  intervalMinutes: z
    .number()
    .int('Interval must be a whole number')
    .min(1, 'Interval must be at least 1 minute')
    .max(10080, 'Interval must be less than 7 days (10080 minutes)')
    .optional(),
  gracePeriodMinutes: z
    .number()
    .int('Grace period must be a whole number')
    .min(0, 'Grace period cannot be negative')
    .max(1440, 'Grace period must be less than 24 hours (1440 minutes)')
    .optional(),
  status: z
    .enum(['UP', 'DOWN', 'DEGRADED', 'PAUSED'])
    .optional(),
})

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>
