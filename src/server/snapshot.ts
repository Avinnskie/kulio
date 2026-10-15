import "server-only"
import { and, eq, desc, count, inArray } from "drizzle-orm"
import type { Viewer, Group, GroupDetail } from "@/collaboration/domain"
import { WorkspaceSchema, GroupDetailSchema } from "@/collaboration/domain"
import { DEFAULT_COURSE_COLOR } from "@/domain"
import { database } from "./database"
import { users, members, groups, tasks, assignments, reminders, courses, personalTasks } from "./schema"
import { ApiError, membership } from "./auth"

export async function snapshot(actor: Viewer | null, selectedGroup: string | null) {
  if (actor === null) return { viewer: null, groups: [], inbox: [], detail: null }
  const db = await database()
  const rooms = await db.select({ group: groups, role: members.role }).from(members).innerJoin(groups, eq(groups.id, members.groupId)).where(eq(members.userId, actor.id))
  const summaries: Group[] = await Promise.all(rooms.map(async (room) => {
    const [size] = await db.select({ value: count() }).from(members).where(eq(members.groupId, room.group.id))
    const [work] = await db.select({ value: count() }).from(personalTasks).innerJoin(members, and(
      eq(members.userId, personalTasks.userId),
      eq(members.groupId, room.group.id),
    ))
    return { id: room.group.id, title: room.group.title, role: room.role, memberCount: size?.value ?? 0, taskCount: work?.value ?? 0,
      inviteCode: room.role === "owner" ? room.group.inviteCode : null,
      inviteExpiresAt: room.role === "owner" ? new Date(room.group.inviteExpiresAt).toISOString() : null }
  }))
  const inbox = await db.select({ id: reminders.id, groupId: groups.id, groupTitle: groups.title, taskTitle: tasks.title, fromName: users.displayName, message: reminders.message, createdAt: reminders.createdAt, readAt: reminders.readAt })
    .from(reminders).innerJoin(groups, eq(groups.id, reminders.groupId)).innerJoin(tasks, eq(tasks.id, reminders.taskId)).innerJoin(users, eq(users.id, reminders.fromId))
    .where(eq(reminders.toId, actor.id)).orderBy(desc(reminders.createdAt)).limit(100)
  let detail: GroupDetail | null = null
  if (selectedGroup !== null) {
    await membership(selectedGroup, actor.id)
    const group = summaries.find((item) => item.id === selectedGroup)
    if (!group) throw new ApiError(404, "Ruang tidak ditemukan.")
    const people = await db.select({ id: users.id, displayName: users.displayName, role: members.role, joinedAt: members.joinedAt }).from(members).innerJoin(users, eq(users.id, members.userId)).where(eq(members.groupId, selectedGroup))
    const memberIds = people.map((member) => member.id)
    const [work, statusRows, courseRows, personalWork] = await Promise.all([
      db.select({ task: tasks, course: courses }).from(tasks).leftJoin(courses, and(
        eq(courses.userId, tasks.createdBy),
        eq(courses.id, tasks.courseId),
      )).where(eq(tasks.groupId, selectedGroup)).orderBy(tasks.dueAt),
      db.select({ row: assignments }).from(assignments).innerJoin(tasks, eq(tasks.id, assignments.taskId)).where(eq(tasks.groupId, selectedGroup)),
      db.select({
        userId: courses.userId,
        id: courses.id,
        name: courses.name,
        shortName: courses.shortName,
        color: courses.color,
      }).from(courses).where(inArray(courses.userId, memberIds)).orderBy(courses.name),
      db.select({
        userId: personalTasks.userId,
        id: personalTasks.id,
        title: personalTasks.title,
        courseId: personalTasks.courseId,
        dueAt: personalTasks.dueAt,
        status: personalTasks.status,
        priority: personalTasks.priority,
        progress: personalTasks.progress,
      }).from(personalTasks).where(inArray(personalTasks.userId, memberIds)).orderBy(personalTasks.dueAt),
    ])
    detail = GroupDetailSchema.parse({
      group,
      members: people,
      memberWorkspaces: people.map((member) => ({
        memberId: member.id,
        courses: courseRows.filter((course) => course.userId === member.id),
        tasks: personalWork.filter((task) => task.userId === member.id),
      })),
      tasks: work.map(({ task, course }) => ({
        ...task,
        course: course ? {
          id: course.id,
          name: course.name,
          shortName: course.shortName,
          color: course.color,
        } : {
          id: task.courseId,
          name: "Mata kuliah tidak tersedia",
          shortName: "N/A",
          color: DEFAULT_COURSE_COLOR,
        },
        assignments: statusRows.filter((item) => item.row.taskId === task.id).map((item) => item.row),
      })),
    })
  }
  return WorkspaceSchema.parse({ viewer: actor, groups: summaries, inbox, detail })
}
