import { rateLimit } from 'express-rate-limit'

function envInt(key: string, defaultVal: number): number {
  const v = process.env[key]
  if (v) {
    const n = parseInt(v, 10)
    if (!isNaN(n) && n > 0) return n
  }
  return defaultVal
}

/**
 * General API rate limiter
 * Limits repeat requests to public APIs and/or internal endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_API_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('RATE_LIMIT_API_MAX', 100),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
  },
})

/**
 * Stricter rate limiter for authentication routes
 * (Signup and Login)
 */
export const authRateLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('RATE_LIMIT_AUTH_MAX', 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again in 15 minutes.',
  },
})

/**
 * Heartbeat rate limiter
 * Prevents spamming the ingestion endpoint
 */
export const heartbeatRateLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_HEARTBEAT_WINDOW_MS', 1 * 60 * 1000),
  limit: envInt('RATE_LIMIT_HEARTBEAT_MAX', 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Heartbeat rate limit exceeded.',
  },
})
