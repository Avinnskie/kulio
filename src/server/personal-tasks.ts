import "server-only"
import { and, eq, inArray, ne, sql } from "drizzle-orm"
import { DEFAULT_COURSE_COLOR, assertNever } from "@/domain"
import type { Viewer } from "@/collaboration/domain"
import { TaskSnapshotSchema, type PersonalCommand, type TaskSnapshot } from "@/tasks/domain"
import { ApiError } from "./auth"
import { database } from "./database"
import { courses, personalTasks, tasks as sharedTasks } from "./schema"

const LEGACY_COURSES: Readonly<Record<string, {
  readonly name: string
  readonly shortName: string
  readonly color: string
}>> = {
  "struktur-data": { name: "Struktur Data", shortName: "STD", color: "#2F6B47" },
  "basis-data": { name: "Basis Data", shortName: "BD", color: "#A86714" },
  "interaksi-manusia-komputer": { name: "Interaksi Manusia dan Komputer", shortName: "IMK", color: "#C96782" },
  "pemrograman-web": { name: "Pemrograman Web", shortName: "WEB", color: "#477FB9" },
}

export async function personalSnapshot(userId: string): Promise<TaskSnapshot> {
  const db = await database()
  const [taskRows, courseRows] = await Promise.all([
    db.select().from(personalTasks).where(eq(personalTasks.userId, userId)).orderBy(personalTasks.dueAt),
    db.select().from(courses).where(eq(courses.userId, userId)).orderBy(courses.createdAt, courses.name),
  ])
  return TaskSnapshotSchema.parse({
    tasks: taskRows.map((task) => ({
      id: task.id,
      title: task.title,
      courseId: task.courseId,
      dueAt: task.dueAt,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      notes: task.notes,
      createdAt: task.createdAt,
    })),
    versions: Object.fromEntries(taskRows.map((task) => [task.id, task.revision])),
    courses: courseRows.map((course) => ({
      id: course.id,
      name: course.name,
      shortName: course.shortName,
      color: course.color,
    })),
  })
}

export async function applyPersonalCommand(command: PersonalCommand, actor: Viewer): Promise<TaskSnapshot> {
  const db = await database()
  switch (command.type) {
    case "import": {
      await db.transaction(async (tx) => {
        const courseIds = [...new Set(command.tasks.map((task) => task.courseId))]
        const now = new Date().toISOString()
        for (const courseId of courseIds) {
          const legacy = LEGACY_COURSES[courseId]
          const fallbackName = courseId.length >= 2 ? courseId.replaceAll("-", " ").slice(0, 60) : `Mata kuliah ${courseId}`
          const fallbackShortName = courseId.replaceAll("-", "").slice(0, 8).toUpperCase()
          await tx.insert(courses).values({
            userId: actor.id,
            id: courseId,
            name: legacy?.name ?? fallbackName,
            shortName: legacy?.shortName ?? (fallbackShortName.length >= 2 ? fallbackShortName : "MK"),
            color: legacy?.color ?? DEFAULT_COURSE_COLOR,
            createdAt: now,
            updatedAt: now,
          }).onConflictDoNothing()
        }
        if (command.tasks.length > 0) {
          await tx.insert(personalTasks).values(command.tasks.map((task) => ({
            ...task,
            userId: actor.id,
            revision: 0,
          }))).onConflictDoNothing()
        }
      })
      break
    }
    case "save": {
      const [course] = await db.select({ id: courses.id }).from(courses).where(and(
        eq(courses.userId, actor.id),
        eq(courses.id, command.task.courseId),
      ))
      if (!course) throw new ApiError(400, "Pilih mata kuliah yang masih tersedia.")
      if (command.expectedVersion === null) {
        const created = await db.insert(personalTasks).values({
          ...command.task,
          userId: actor.id,
          revision: 0,
        }).onConflictDoNothing().returning({ id: personalTasks.id })
        if (created.length === 0) throw new ApiError(409, "Tugas dengan identitas ini sudah tersimpan.")
      } else {
        const changed = await db.update(personalTasks).set({
          title: command.task.title,
          courseId: command.task.courseId,
          dueAt: command.task.dueAt,
          status: command.task.status,
          priority: command.task.priority,
          progress: command.task.progress,
          notes: command.task.notes,
          revision: sql`${personalTasks.revision} + 1`,
        }).where(and(
          eq(personalTasks.id, command.task.id),
          eq(personalTasks.userId, actor.id),
          eq(personalTasks.revision, command.expectedVersion),
        )).returning({ id: personalTasks.id })
        if (changed.length === 0) throw new ApiError(409, "Tugas berubah pada perangkat lain. Muat ulang data lalu coba kembali.")
      }
      break
    }
    case "save_many": {
      const courseIds = [...new Set(command.tasks.map((task) => task.courseId))]
      await db.transaction(async (tx) => {
        const availableCourses = await tx.select({ id: courses.id }).from(courses).where(and(
          eq(courses.userId, actor.id),
          inArray(courses.id, courseIds),
        ))
        if (availableCourses.length !== courseIds.length) {
          throw new ApiError(400, "Salah satu mata kuliah tidak lagi tersedia.")
        }
        for (const task of command.tasks) {
          const created = await tx.insert(personalTasks).values({
            ...task,
            userId: actor.id,
            revision: 0,
          }).onConflictDoNothing().returning({ id: personalTasks.id })
          if (created.length === 0) {
            throw new ApiError(409, "Salah satu tugas dalam daftar sudah tersimpan.")
          }
        }
      })
      break
    }
    case "delete": {
      const deleted = await db.delete(personalTasks).where(and(
        eq(personalTasks.id, command.taskId),
        eq(personalTasks.userId, actor.id),
        eq(personalTasks.revision, command.expectedVersion),
      )).returning({ id: personalTasks.id })
      if (deleted.length === 0) throw new ApiError(409, "Tugas berubah pada perangkat lain. Muat ulang data lalu coba kembali.")
      break
    }
    case "save_course": {
      const [duplicate] = await db.select({ id: courses.id }).from(courses).where(and(
        eq(courses.userId, actor.id),
        ne(courses.id, command.course.id),
        sql`lower(trim(${courses.name})) = lower(trim(${command.course.name}))`,
      ))
      if (duplicate) throw new ApiError(409, "Nama mata kuliah sudah digunakan.")
      const now = new Date().toISOString()
      await db.insert(courses).values({
        userId: actor.id,
        ...command.course,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: [courses.userId, courses.id],
        set: {
          name: command.course.name,
          shortName: command.course.shortName,
          color: command.course.color,
          updatedAt: now,
        },
      })
      break
    }
    case "delete_course": {
      const [personalUse, sharedUse] = await Promise.all([
        db.select({ id: personalTasks.id }).from(personalTasks).where(and(
          eq(personalTasks.userId, actor.id),
          eq(personalTasks.courseId, command.courseId),
        )).limit(1),
        db.select({ id: sharedTasks.id }).from(sharedTasks).where(and(
          eq(sharedTasks.createdBy, actor.id),
          eq(sharedTasks.courseId, command.courseId),
        )).limit(1),
      ])
      if (personalUse[0] || sharedUse[0]) {
        throw new ApiError(409, "Mata kuliah masih digunakan oleh tugas. Pindahkan tugas terlebih dahulu.")
      }
      const deleted = await db.delete(courses).where(and(
        eq(courses.userId, actor.id),
        eq(courses.id, command.courseId),
      )).returning({ id: courses.id })
      if (deleted.length === 0) throw new ApiError(404, "Mata kuliah tidak ditemukan.")
      break
    }
    default:
      return assertNever(command)
  }
  return personalSnapshot(actor.id)
}
