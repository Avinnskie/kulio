import "server-only"
import { Buffer } from "node:buffer"
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const options = { N: 32_768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) => {
      if (error) { reject(error); return }
      resolve(key)
    })
  })
}
export async function hashPassword(password: string) {
  const salt = randomBytes(24).toString("hex")
  const key = await derive(password, salt)
  return `scrypt-v1$${salt}$${key.toString("hex")}`
}
export async function verifyPassword(password: string, stored: string | null) {
  const match = stored?.match(/^scrypt-v1\$([a-f0-9]{48})\$([a-f0-9]{128})$/)
  if (stored !== null && (!match?.[1] || !match[2])) throw new TypeError("Unsupported credential hash")
  const salt = match?.[1] ?? "0".repeat(48)
  const expected = match?.[2] ? Buffer.from(match[2], "hex") : Buffer.alloc(64)
  const actual = await derive(password, salt)
  const equal = timingSafeEqual(actual, expected)
  return stored !== null && equal
}
