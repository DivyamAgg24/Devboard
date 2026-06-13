// lib/crypto.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY! // 32-byte hex string
const ALGORITHM = 'aes-256-gcm'

export function encryptToken(plain: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
    )
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    // store as iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptToken(stored: string): string {
    const [ivHex, authTagHex, encryptedHex] = stored.split(':')
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        Buffer.from(ivHex, 'hex')
    )
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8')
}