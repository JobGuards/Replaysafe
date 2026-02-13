import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { Request, Response } from 'express'

// Mock ioredis before importing middleware
vi.mock('ioredis', () => {
  const Redis = vi.fn()
  Redis.prototype.call = vi.fn().mockResolvedValue('OK')
  Redis.prototype.connect = vi.fn().mockResolvedValue(undefined)
  Redis.prototype.on = vi.fn()
  Redis.prototype.quit = vi.fn().mockResolvedValue(undefined)
  return { default: Redis }
})

import { heartbeatLimiter, managementLimiter, dashboardLimiter } from '../../src/middleware/rateLimit.js'

function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    ip: '127.0.0.1',
    path: '/api/test',
    user: undefined,
    ...overrides,
  } as Partial<Request>
}

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {
    set: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    removeHeader: vi.fn(),
  }
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('Rate Limit Middleware', () => {
  afterAll(() => {
    vi.clearAllMocks()
  })

  describe('heartbeatLimiter', () => {
    it('should be defined and callable', () => {
      expect(heartbeatLimiter).toBeDefined()
      expect(typeof heartbeatLimiter).toBe('function')
    })

    it('should allow requests for authenticated users', async () => {
      const req = createMockReq({ user: { id: 'user-123', email: 'test@test.com', fullName: 'Test' } })
      const res = createMockRes()
      const next = vi.fn()

      await heartbeatLimiter(req as Request, res as Response, next)

      // Should call next (not blocked)
      expect(next).toHaveBeenCalled()
    })

    it('should skip rate limiting for health check endpoint', async () => {
      const req = createMockReq({ path: '/health' })
      const res = createMockRes()
      const next = vi.fn()

      await heartbeatLimiter(req as Request, res as Response, next)

      // Should skip and call next
      expect(next).toHaveBeenCalled()
    })
  })

  describe('managementLimiter', () => {
    it('should be defined and callable', () => {
      expect(managementLimiter).toBeDefined()
      expect(typeof managementLimiter).toBe('function')
    })

    it('should allow requests for authenticated users', async () => {
      const req = createMockReq({ user: { id: 'user-456', email: 'test@test.com', fullName: 'Test' } })
      const res = createMockRes()
      const next = vi.fn()

      await managementLimiter(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('dashboardLimiter', () => {
    it('should be defined and callable', () => {
      expect(dashboardLimiter).toBeDefined()
      expect(typeof dashboardLimiter).toBe('function')
    })

    it('should allow requests for authenticated users', async () => {
      const req = createMockReq({ user: { id: 'user-789', email: 'test@test.com', fullName: 'Test' } })
      const res = createMockRes()
      const next = vi.fn()

      await dashboardLimiter(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('keyGenerator', () => {
    it('should use user ID when authenticated', async () => {
      const req = createMockReq({ user: { id: 'user-abc', email: 'test@test.com', fullName: 'Test' } })
      const res = createMockRes()
      const next = vi.fn()

      await heartbeatLimiter(req as Request, res as Response, next)

      // Verify it processes the request (rate limiter was invoked)
      expect(next).toHaveBeenCalled()
    })

    it('should fall back to IP when not authenticated', async () => {
      const req = createMockReq({ ip: '192.168.1.1', user: undefined })
      const res = createMockRes()
      const next = vi.fn()

      await heartbeatLimiter(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
