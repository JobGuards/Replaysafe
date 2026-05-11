import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY = process.env.MASTER_ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.MASTER_ENCRYPTION_KEY, 'salt', 32)
  : crypto.randomBytes(32) // Fallback for dev if not set, but will lose data on restart

if (!process.env.MASTER_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('MASTER_ENCRYPTION_KEY must be set in production')
}

/**
 * Encrypts a string
 * Returns format: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a string
 */
export function decrypt(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted text format')
    }
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error)
    return encryptedText // Return original if decryption fails (might be unencrypted legacy data)
  }
}

/**
 * Encrypts a JSON object
 */
export function encryptJSON(obj: any): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypts a JSON object
 */
export function decryptJSON(encryptedText: string): any {
  const decrypted = decrypt(encryptedText)
  try {
    return JSON.parse(decrypted)
  } catch (error) {
    return decrypted
  }
}

/**
 * Signs a string with HMAC-SHA256
 */
export function signToken(data: string): string {
  const hmac = crypto.createHmac('sha256', KEY)
  hmac.update(data)
  return hmac.digest('hex')
}

/**
 * Verifies an HMAC-SHA256 signature
 */
export function verifyToken(data: string, signature: string): boolean {
  try {
    const expected = signToken(data)
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
