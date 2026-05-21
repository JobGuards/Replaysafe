import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/server.ts'
import { apiKeyMiddleware } from '../../src/middleware/auth.ts'
import { prisma } from '@replaysafe/db'

vi.mock('@replaysafe/db', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn().mockReturnValue({ catch: vi.fn() }),
    }
  }
}))

// Test app with the middleware
const app = createApp()
app.get('/test-api-key', apiKeyMiddleware, (req, res) => {
  res.json({ projectId: req.project?.id })
})

describe('apiKeyMiddleware', () => {
  const VALID_KEY = 'sk_test_1234567890'
  const INVALID_KEY = 'sk_invalid_key'

  it('should return 401 if X-API-Key header is missing', async () => {
    const response = await request(app).get('/test-api-key')
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('X-API-Key header is missing')
  })

  it('should return 403 if API key is invalid', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null)
    
    const response = await request(app)
      .get('/test-api-key')
      .set('X-API-Key', INVALID_KEY)
    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Invalid API Key')
  })

  it('should attach projectId to request if API key is valid', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'key_id_123',
      projectId: 'proj_id_123',
    } as any)
    
    const response = await request(app)
      .get('/test-api-key')
      .set('X-API-Key', VALID_KEY)
    
    expect(response.status).toBe(200)
    expect(response.body.projectId).toBe('proj_id_123')
  })

  it('should update lastUsed timestamp', async () => {
    const mockDate = new Date('2026-05-14T10:00:00Z')
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'key_id_123',
      projectId: 'proj_id_123',
    } as any)
    
    await request(app)
      .get('/test-api-key')
      .set('X-API-Key', VALID_KEY)

    // Wait for the async update to be called
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(prisma.apiKey.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'key_id_123' },
      data: expect.objectContaining({
        lastUsed: expect.any(Date)
      })
    }))
  })
})
