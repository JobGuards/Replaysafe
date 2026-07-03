import { describe, it, expect, beforeAll } from 'vitest'
import { generateToken, verifyToken } from '../utils/jwt.js'

describe('JWT Utilities', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-must-be-very-long-and-secure-for-hashing'
  })

  it('should generate and verify a valid JWT token', () => {
    const payload = { userId: 'user-123', email: 'test@example.com' }
    const token = generateToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const decoded = verifyToken(token)
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })

  it('should fail verification with invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow('Invalid token')
  })
})
