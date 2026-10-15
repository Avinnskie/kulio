import "server-only"
import { randomUUID } from "node:crypto"
import { and, eq, notInArray, sql, desc } from "drizzle-orm"
import type { Command, Viewer } from "@/collaboration/domain"
import { progressForStatus } from "@/domain"
import { database } from "./database"
import { tasks, members, assignments, reminders, courses } from "./schema"
import { ApiError, membership } from "./auth"

export async function saveSharedTask(command: Extract<Command, { type: "save_task" }>, actor: Viewer) {
  const member = await membership(command.groupId, actor.id)
  const db = await database()
  await db.transaction(async (tx) => {
    const roomMembers = await tx.select().from(members).where(eq(members.groupId, command.groupId))
    const targets = command.allMembers ? roomMembers.map((row) => row.userId) : [...new Set(command.memberIds)]
    if (targets.length === 0 || targets.some((id) => !roomMembers.some((row) => row.userId === id))) throw new ApiError(400, "Pilih minimal satu anggota dari ruang ini.")
    const values = { title: command.title, courseId: command.courseId, dueAt: command.dueAt, notes: command.notes, priority: command.priority, allMembers: command.allMembers }
    const taskId = command.taskId ?? randomUUID()
    let courseOwner = actor.id
    if (command.taskId !== null) {
      const [task] = await tx.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.groupId, command.groupId)))
      if (!task) throw new ApiError(404, "Tugas tidak ditemukan.")
      if (task.createdBy !== actor.id && member.role !== "owner") throw new ApiError(403, "Hanya pembuat tugas atau pemilik ruang yang dapat mengeditnya.")
      courseOwner = task.createdBy
      await tx.update(tasks).set(values).where(eq(tasks.id, taskId))
      await tx.delete(assignments).where(and(eq(assignments.taskId, taskId), notInArray(assignments.memberId, targets)))
    }
    const [course] = await tx.select({ id: courses.id }).from(courses).where(and(
      eq(courses.userId, courseOwner),
      eq(courses.id, command.courseId),
    ))
    if (!course) throw new ApiError(400, "Mata kuliah tugas bersama tidak tersedia.")
    if (command.taskId === null) {
      await tx.insert(tasks).values({ ...values, id: taskId, groupId: command.groupId, createdBy: actor.id, createdAt: new Date().toISOString() })
    }
    await tx.insert(assignments).values(targets.map((memberId) => ({ taskId, memberId, status: "belum_selesai" as const, progress: 0, version: 0, updatedAt: new Date().toISOString(), updatedBy: actor.id }))).onConflictDoNothing()
  })
}

export async function deleteSharedTask(command: Extract<Command, { type: "delete_task" }>, actor: Viewer) {
  const member = await membership(command.groupId, actor.id)
  const db = await database()
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, command.taskId), eq(tasks.groupId, command.groupId)))
  if (!task) throw new ApiError(404, "Tugas tidak ditemukan.")
  if (task.createdBy !== actor.id && member.role !== "owner") throw new ApiError(403, "Hanya pembuat tugas atau pemilik ruang yang dapat menghapusnya.")
  await db.delete(tasks).where(eq(tasks.id, command.taskId))
}

export async function updateAssignment(command: Extract<Command, { type: "update_assignment" }>, actor: Viewer) {
  await membership(command.groupId, actor.id)
  const db = await database()
  const [row] = await db.select({ assignment: assignments }).from(assignments).innerJoin(tasks, eq(tasks.id, assignments.taskId))
    .where(and(eq(tasks.groupId, command.groupId), eq(assignments.taskId, command.taskId), eq(assignments.memberId, command.memberId)))
  if (!row) throw new ApiError(404, "Penugasan anggota tidak ditemukan.")
  const changed = await db.update(assignments).set({
    status: command.status, progress: progressForStatus(command.status, row.assignment.progress),
    version: sql`${assignments.version} + 1`, updatedAt: new Date().toISOString(), updatedBy: actor.id,
  }).where(and(eq(assignments.taskId, command.taskId), eq(assignments.memberId, command.memberId), eq(assignments.version, command.expectedVersion))).returning({ version: assignments.version })
  if (changed.length === 0) throw new ApiError(409, "Status baru saja diubah anggota lain. Data telah diperbarui; silakan pilih kembali.")
}

export async function sendReminder(command: Extract<Command, { type: "remind" }>, actor: Viewer) {
  await membership(command.groupId, actor.id)
  if (command.memberId === actor.id) throw new ApiError(400, "Pilih anggota lain untuk diingatkan.")
  const db = await database()
  const [row] = await db.select({ status: assignments.status }).from(assignments).innerJoin(tasks, eq(tasks.id, assignments.taskId))
    .where(and(eq(tasks.groupId, command.groupId), eq(assignments.taskId, command.taskId), eq(assignments.memberId, command.memberId)))
  if (!row) throw new ApiError(404, "Penugasan anggota tidak ditemukan.")
  if (row.status === "selesai") throw new ApiError(400, "Tugas anggota ini sudah selesai.")
  const [last] = await db.select().from(reminders).where(and(eq(reminders.taskId, command.taskId), eq(reminders.fromId, actor.id), eq(reminders.toId, command.memberId))).orderBy(desc(reminders.createdAt)).limit(1)
  if (last && Date.now() - new Date(last.createdAt).getTime() < 60_000) throw new ApiError(429, "Pengingat sudah dikirim. Tunggu satu menit sebelum mengirim lagi.")
  await db.insert(reminders).values({ id: randomUUID(), groupId: command.groupId, taskId: command.taskId, fromId: actor.id, toId: command.memberId, message: command.message, createdAt: new Date().toISOString(), readAt: null })
}

export async function readReminder(reminderId: string, actor: Viewer) {
  const db = await database()
  await db.update(reminders).set({ readAt: new Date().toISOString() }).where(and(eq(reminders.id, reminderId), eq(reminders.toId, actor.id)))
}
