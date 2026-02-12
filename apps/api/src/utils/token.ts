import crypto from 'crypto'
import { prisma } from '@stillup/db'

/**
 * Generate a unique heartbeat token
 * Format: hb_<16 random hex characters>
 * Example: hb_a1b2c3d4e5f6g7h8
 */
export async function generateHeartbeatToken(): Promise<string> {
  let token: string
  let isUnique = false

  // Keep generating until we get a unique token
  while (!isUnique) {
    const randomBytes = crypto.randomBytes(12)
    const randomHex = randomBytes.toString('hex')
    token = `hb_${randomHex}`

    // Check if token already exists in database
    const existing = await prisma.monitor.findUnique({
      where: { heartbeatToken: token },
    })

    isUnique = !existing
  }

  return token!
}

/**
 * Validate heartbeat token format
 */
export function isValidHeartbeatToken(token: string): boolean {
  // Should start with "hb_" followed by 24 hex characters
  return /^hb_[0-9a-f]{24}$/i.test(token)
}
