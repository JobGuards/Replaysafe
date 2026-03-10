import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/server.ts'
import { apiKeyMiddleware } from '../../src/middleware/auth.ts'
import { prisma } from '@stillup/db'

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
    const response = await request(app)
      .get('/test-api-key')
      .set('X-API-Key', INVALID_KEY)
    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Invalid API Key')
  })

  it('should attach projectId to request if API key is valid', async () => {
    const response = await request(app)
      .get('/test-api-key')
      .set('X-API-Key', VALID_KEY)
    
    expect(response.status).toBe(200)
    expect(response.body.projectId).toBeDefined()
  })

  it('should update lastUsed timestamp', async () => {
    // Get current lastUsed
    const keyBefore = await prisma.apiKey.findUnique({
      where: { key: VALID_KEY }
    })
    
    const lastUsedBefore = keyBefore?.lastUsed

    // Wait a short bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 100))

    await request(app)
      .get('/test-api-key')
      .set('X-API-Key', VALID_KEY)

    // Wait for the async update to finish (small delay as it's fire-and-forget in middleware)
    await new Promise(resolve => setTimeout(resolve, 500))

    const keyAfter = await prisma.apiKey.findUnique({
      where: { key: VALID_KEY }
    })

    expect(keyAfter?.lastUsed).toBeDefined()
    if (lastUsedBefore) {
      expect(keyAfter!.lastUsed!.getTime()).toBeGreaterThan(lastUsedBefore.getTime())
    }
  })
})
