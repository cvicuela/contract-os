import crypto from 'node:crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32-byte hex string
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
