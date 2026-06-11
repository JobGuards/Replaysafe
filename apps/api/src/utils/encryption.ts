import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

const MASTER_KEY: string = process.env.MASTER_ENCRYPTION_KEY ?? ''
if (!MASTER_KEY) {
  throw new Error(
    'FATAL: MASTER_ENCRYPTION_KEY environment variable is not set. '
    + 'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  )
}

/**
 * Derives a 32-byte key from the master key using a random salt.
 * The salt is prepended to the ciphertext so decryption can re-derive the same key.
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.scryptSync(MASTER_KEY, salt, 32)
}

/**
 * Encrypts a string
 * Returns format: salt:iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  const salt = crypto.randomBytes(16)
  const key = deriveKey(salt)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a string
 * @throws Error if decryption fails (wrong key, corrupted data, or invalid format)
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  const [saltHex, ivHex, authTagHex, ...rest] = parts
  const encrypted = rest.join(':')

  if (!saltHex || !ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format: expected salt:iv:authTag:ciphertext')
  }

  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = deriveKey(salt)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypts a JSON object
 */
export function encryptJSON(obj: any): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypts a JSON object.
 * @throws Error if decryption fails
 */
export function decryptJSON(encryptedText: string): any {
  const decrypted = decrypt(encryptedText)
  try {
    return JSON.parse(decrypted)
  } catch {
    throw new Error('Decryption succeeded but result is not valid JSON')
  }
}

/**
 * Signs a string with HMAC-SHA256 using the master key.
 */
export function signToken(data: string): string {
  const hmac = crypto.createHmac('sha256', MASTER_KEY)
  hmac.update(data)
  return hmac.digest('hex')
}

/**
 * Verifies an HMAC-SHA256 signature.
 */
export function verifyToken(data: string, signature: string): boolean {
  try {
    const expected = signToken(data)
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
