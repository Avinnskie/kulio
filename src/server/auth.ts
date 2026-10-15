import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { and, eq, gt, sql } from "drizzle-orm"
import type { NextRequest } from "next/server"
import type { Viewer } from "@/collaboration/domain"
import { database } from "./database"
import { sessions, users, members, limits, accounts } from "./schema"

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly retryAfterSeconds?: number) { super(message); this.name = "ApiError" }
}
export const SESSION_COOKIE = "ruangtugas_member"
export function digest(value: string) { return createHash("sha256").update(value).digest("hex") }
export function invite() { return randomBytes(8).toString("hex").toUpperCase() }
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin === null || origin !== request.nextUrl.origin) throw new ApiError(403, "Permintaan harus berasal dari aplikasi ini.")
}
export async function viewer(request: NextRequest): Promise<Viewer | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const db = await database()
  const [found] = await db.select({ id: users.id, displayName: users.displayName }).from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, Date.now())))
  return found ?? null
}
export async function account(request: NextRequest) {
  const member = await viewer(request)
  if (member === null) return null
  const db = await database()
  const [credentials] = await db.select({ email: accounts.email }).from(accounts).where(eq(accounts.userId, member.id))
  return credentials ? { ...member, email: credentials.email } : null
}
export async function authenticatedViewer(request: NextRequest): Promise<Viewer | null> {
  const registered = await account(request)
  return registered ? { id: registered.id, displayName: registered.displayName } : null
}
export async function requireAuthenticatedViewer(request: NextRequest): Promise<Viewer> {
  const actor = await authenticatedViewer(request)
  if (actor === null) throw new ApiError(401, "Masuk ke akun untuk mengakses data Anda.")
  return actor
}
export async function membership(groupId: string, userId: string) {
  const db = await database()
  const [member] = await db.select().from(members).where(and(eq(members.groupId, groupId), eq(members.userId, userId)))
  if (!member) throw new ApiError(403, "Anda belum bergabung ke ruang ini.")
  return member
}
export async function rateLimit(key: string, budget: number) {
  const db = await database()
  const now = Date.now()
  const [row] = await db.insert(limits).values({ key, startedAt: now, count: 1 }).onConflictDoUpdate({
    target: limits.key,
    set: {
      count: sql`CASE WHEN ${limits.startedAt} < ${now - 60_000} THEN 1 ELSE ${limits.count} + 1 END`,
      startedAt: sql`CASE WHEN ${limits.startedAt} < ${now - 60_000} THEN ${now} ELSE ${limits.startedAt} END`,
    },
  }).returning()
  if (row && row.count > budget) throw new ApiError(429, "Terlalu banyak permintaan. Coba lagi dalam satu menit.", 60)
}
