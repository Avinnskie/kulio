import "server-only"
import { randomUUID } from "node:crypto"
import { and, eq, count } from "drizzle-orm"
import type { Viewer } from "@/collaboration/domain"
import { database } from "./database"
import { groups, members, assignments, tasks } from "./schema"
import { ApiError, digest, invite, membership } from "./auth"

export async function createGroup(title: string, actor: Viewer) {
  const db = await database()
  const [total] = await db.select({ value: count() }).from(members).where(eq(members.userId, actor.id))
  if (total && total.value >= 20) throw new ApiError(400, "Maksimal 20 ruang per anggota.")
  const groupId = randomUUID()
  const code = invite()
  const now = new Date().toISOString()
  await db.transaction(async (tx) => {
    await tx.insert(groups).values({ id: groupId, title, ownerId: actor.id, inviteCode: code, inviteHash: digest(code), inviteExpiresAt: Date.now() + 7 * 86_400_000, createdAt: now })
    await tx.insert(members).values({ groupId, userId: actor.id, role: "owner", joinedAt: now })
  })
  return groupId
}

export async function joinGroup(code: string, actor: Viewer) {
  const db = await database()
  return db.transaction(async (tx) => {
    const [group] = await tx.select().from(groups).where(eq(groups.inviteHash, digest(code)))
    if (!group || group.inviteExpiresAt < Date.now()) throw new ApiError(404, "Kode tidak ditemukan atau telah kedaluwarsa.")
    const [existing] = await tx.select().from(members).where(and(eq(members.groupId, group.id), eq(members.userId, actor.id)))
    if (existing) return group.id
    const [roomSize] = await tx.select({ value: count() }).from(members).where(eq(members.groupId, group.id))
    const [rooms] = await tx.select({ value: count() }).from(members).where(eq(members.userId, actor.id))
    if ((roomSize?.value ?? 0) >= 100 || (rooms?.value ?? 0) >= 20) throw new ApiError(400, "Batas jumlah ruang atau anggota telah tercapai.")
    const now = new Date().toISOString()
    await tx.insert(members).values({ groupId: group.id, userId: actor.id, role: "member", joinedAt: now })
    const shared = await tx.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.groupId, group.id), eq(tasks.allMembers, true)))
    if (shared.length > 0) await tx.insert(assignments).values(shared.map((task) => ({ taskId: task.id, memberId: actor.id, status: "belum_selesai" as const, progress: 0, version: 0, updatedAt: now, updatedBy: actor.id })))
    return group.id
  })
}

export async function rotateInvite(groupId: string, actor: Viewer) {
  const member = await membership(groupId, actor.id)
  if (member.role !== "owner") throw new ApiError(403, "Hanya pemilik ruang yang dapat mengganti kode undangan.")
  const db = await database()
  const code = invite()
  await db.update(groups).set({ inviteCode: code, inviteHash: digest(code), inviteExpiresAt: Date.now() + 7 * 86_400_000 }).where(eq(groups.id, groupId))
}
