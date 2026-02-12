import { Monitor } from '@prisma/client'

export type CalculatedStatus = 'UP' | 'LATE' | 'MISSED' | 'DEGRADED' | 'PAUSED'

/**
 * Calculate the current status of a monitor based on its last heartbeat and expected schedule
 */
export function calculateMonitorStatus(monitor: Monitor): CalculatedStatus {
  // If manually paused, return paused
  if (monitor.status === 'PAUSED') {
    return 'PAUSED'
  }

  // If no expected time yet (brand new monitor), consider UP
  if (!monitor.nextExpectedAt) {
    return 'UP'
  }

  const now = new Date()
  const nextExpected = new Date(monitor.nextExpectedAt)
  const graceDeadline = new Date(nextExpected.getTime() + monitor.graceSeconds * 1000)

  // Still has time before due
  if (now < nextExpected) {
    return 'UP'
  }

  // Past due but within grace period
  if (now < graceDeadline) {
    return 'LATE'
  }

  // Past grace period - missed
  return 'MISSED'
}

/**
 * Calculate when the next heartbeat is expected based on schedule and last heartbeat time
 */
export function calculateNextExpectedAt(
  schedule: string,
  lastHeartbeatAt: Date
): Date {
  // Parse cron schedule to determine interval
  let intervalMs = 0

  // Pattern: */X * * * * (every X minutes)
  const everyMinutesMatch = schedule.match(/^\*\/(\d+) \* \* \* \*$/)
  if (everyMinutesMatch) {
    const minutes = parseInt(everyMinutesMatch[1])
    intervalMs = minutes * 60 * 1000
  }

  // Pattern: 0 */X * * * (every X hours)
  const everyHoursMatch = schedule.match(/^0 \*\/(\d+) \* \* \*$/)
  if (everyHoursMatch) {
    const hours = parseInt(everyHoursMatch[1])
    intervalMs = hours * 60 * 60 * 1000
  }

  // Pattern: 0 X * * * (daily at hour X)
  const dailyMatch = schedule.match(/^0 (\d+) \* \* \*$/)
  if (dailyMatch) {
    intervalMs = 24 * 60 * 60 * 1000 // 1 day
  }

  // If we couldn't parse, default to 1 hour
  if (intervalMs === 0) {
    intervalMs = 60 * 60 * 1000
  }

  return new Date(lastHeartbeatAt.getTime() + intervalMs)
}
