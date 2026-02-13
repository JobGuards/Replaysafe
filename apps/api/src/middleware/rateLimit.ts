import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import Redis from 'ioredis'
import { Request } from 'express'

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    // Retry with exponential backoff
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  lazyConnect: true, // Connect only when needed
})

// Handle Redis connection errors gracefully
redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message)
})

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully')
})

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('[Redis] Failed to connect:', err.message)
})

/**
 * Key generator function for rate limiting
 * Uses user ID from API key/JWT auth, falls back to IP (with IPv6 support)
 */
function keyGenerator(req: Request): string {
  // Use authenticated user ID if available
  if (req.user?.id) {
    return `user:${req.user.id}`
  }
  // Fall back to IP address using official helper (handles IPv6 properly)
  return `ip:${ipKeyGenerator(req)}`
}

/**
 * Skip function to bypass rate limiting for health checks
 */
function skipHealthCheck(req: Request): boolean {
  return req.path === '/health'
}

/**
 * Heartbeat endpoint rate limiter
 * 1000 requests per minute per user/key
 */
export const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
  keyGenerator,
  skip: skipHealthCheck,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as Promise<unknown>,
    prefix: 'rl:heartbeat:',
  }),
  message: { error: 'Too many heartbeat requests, please try again later' },
})

/**
 * Management API rate limiter (monitors, API keys)
 * 100 requests per minute per user
 */
export const managementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipHealthCheck,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as Promise<unknown>,
    prefix: 'rl:management:',
  }),
  message: { error: 'Too many requests to management API, please try again later' },
})

/**
 * Dashboard/Auth API rate limiter
 * 500 requests per minute per user
 */
export const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipHealthCheck,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as Promise<unknown>,
    prefix: 'rl:dashboard:',
  }),
  message: { error: 'Too many requests to dashboard API, please try again later' },
})

// Export Redis client for testing/cleanup
export { redisClient }
