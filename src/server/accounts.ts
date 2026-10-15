import "server-only"
import { randomBytes, randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import type { Registration, Login, AuthState } from "@/auth/domain"
import { database } from "./database"
import { accounts, sessions, users } from "./schema"
import { ApiError, SESSION_COOKIE, account, digest, viewer } from "./auth"
import { hashPassword, verifyPassword } from "./passwords"

export async function authState(request: NextRequest): Promise<AuthState> {
  const user = await account(request)
  return { user, legacyProfile: user ? null : await viewer(request) }
}

export async function register(command: Registration, request: NextRequest) {
  const existingUser = await account(request)
  if (existingUser) throw new ApiError(409, "Anda sudah masuk. Keluar terlebih dahulu untuk membuat akun lain.")
  const legacy = await viewer(request)
  const db = await database()
  const [existingEmail] = await db.select({ id: accounts.userId }).from(accounts).where(eq(accounts.email, command.email))
  if (existingEmail) throw new ApiError(409, "Email sudah terdaftar. Gunakan halaman masuk.")
  const passwordHash = await hashPassword(command.password)
  const userId = legacy?.id ?? randomUUID()
  const token = randomBytes(32).toString("hex")
  const maxAge = 7 * 86_400
  const now = new Date().toISOString()
  await db.transaction(async (tx) => {
    if (legacy === null) await tx.insert(users).values({ id: userId, displayName: command.displayName, createdAt: now })
    const created = await tx.insert(accounts).values({ userId, email: command.email, passwordHash, createdAt: now }).onConflictDoNothing().returning({ id: accounts.userId })
    if (created.length === 0) throw new ApiError(409, "Email atau profil ini sudah terdaftar. Gunakan halaman masuk.")
    if (legacy !== null) await tx.update(users).set({ displayName: command.displayName }).where(eq(users.id, userId))
    await tx.delete(sessions).where(eq(sessions.userId, userId))
    await tx.insert(sessions).values({ tokenHash: digest(token), userId, expiresAt: Date.now() + maxAge * 1000 })
  })
  return { token, maxAge, user: { id: userId, displayName: command.displayName, email: command.email } }
}

export async function login(command: Login, request: NextRequest) {
  const db = await database()
  const [found] = await db.select({ credentials: accounts, user: users }).from(accounts).innerJoin(users, eq(accounts.userId, users.id)).where(eq(accounts.email, command.email))
  const valid = await verifyPassword(command.password, found?.credentials.passwordHash ?? null)
  if (!found || !valid) throw new ApiError(401, "Email atau kata sandi tidak sesuai.")
  const token = randomBytes(32).toString("hex")
  const maxAge = (command.remember ? 30 : 7) * 86_400
  const previous = request.cookies.get(SESSION_COOKIE)?.value
  await db.transaction(async (tx) => {
    if (previous) await tx.delete(sessions).where(eq(sessions.tokenHash, digest(previous)))
    await tx.insert(sessions).values({ tokenHash: digest(token), userId: found.user.id, expiresAt: Date.now() + maxAge * 1000 })
  })
  return { token, maxAge, user: { id: found.user.id, displayName: found.user.displayName, email: found.credentials.email } }
}

export async function logout(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) { const db = await database(); await db.delete(sessions).where(eq(sessions.tokenHash, digest(token))) }
}
