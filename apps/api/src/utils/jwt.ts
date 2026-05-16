import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Add it to your .env file.')
}

const SECRET = JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  email: string
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  })
}

/**
 * Verify and decode a JWT token
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload
    return decoded
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    throw new Error('Token verification failed')
  }
}
