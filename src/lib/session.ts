// src/lib/session.ts  — replace encrypt/decrypt with Web Crypto

const ALGORITHM = "AES-GCM"

function getSecret(): Promise<CryptoKey> {
    const raw = Buffer.from(process.env.SESSION_SECRET!, "hex")
    return crypto.subtle.importKey(
        "raw",
        raw,
        { name: ALGORITHM },
        false,
        ["encrypt", "decrypt"]
    )
}

export async function encrypt(sessionId: string): Promise<string> {
    const key = await getSecret()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encoded = new TextEncoder().encode(sessionId)
    // AES-GCM in Web Crypto appends the auth tag automatically
    const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoded
    )

    const encryptedArr = new Uint8Array(encrypted)
    // Last 16 bytes are the auth tag, rest is ciphertext
    const ciphertext = encryptedArr.slice(0, -16)
    const authTag    = encryptedArr.slice(-16)

    return [
        Buffer.from(iv).toString("hex"),
        Buffer.from(authTag).toString("hex"),
        Buffer.from(ciphertext).toString("hex"),
    ].join(":")
}

export async function decrypt(cipherText: string): Promise<string | null> {
    try {
        const [ivHex, authTagHex, encryptedHex] = cipherText.split(":")
        if (!ivHex || !authTagHex || !encryptedHex) return null

        const key       = await getSecret()
        const iv        = Buffer.from(ivHex, "hex")
        const authTag   = Buffer.from(authTagHex, "hex")
        const ciphertext = Buffer.from(encryptedHex, "hex")

        // Web Crypto expects ciphertext + auth tag concatenated
        const combined = new Uint8Array(ciphertext.length + authTag.length)
        combined.set(ciphertext, 0)
        combined.set(authTag, ciphertext.length)

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            combined
        )

        return new TextDecoder().decode(decrypted)
    } catch {
        return null
    }
}