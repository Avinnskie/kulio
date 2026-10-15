import { sqliteTable, text, integer, primaryKey, foreignKey } from "drizzle-orm/sqlite-core"
import type { CourseId, TaskId, TaskStatus, TaskPriority } from "@/domain"

export const users = sqliteTable("collab_users", {
  id: text("id").primaryKey(), displayName: text("display_name").notNull(), createdAt: text("created_at").notNull(),
})
export const sessions = sqliteTable("collab_sessions", {
  tokenHash: text("token_hash").primaryKey(), userId: text("user_id").notNull().references(() => users.id), expiresAt: integer("expires_at").notNull(),
})
export const accounts = sqliteTable("accounts", {
  userId: text("user_id").primaryKey().references(() => users.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
})
export const courses = sqliteTable("personal_courses", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  id: text("id").$type<CourseId>().notNull(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.id] })])
export const personalTasks = sqliteTable("personal_tasks", {
  id: text("id").$type<TaskId>().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  courseId: text("course_id").$type<CourseId>().notNull(),
  dueAt: text("due_at").notNull(),
  status: text("status").$type<TaskStatus>().notNull(),
  priority: text("priority").$type<TaskPriority>().notNull(),
  progress: integer("progress").notNull(),
  notes: text("notes").notNull(),
  createdAt: text("created_at").notNull(),
  revision: integer("revision").notNull().default(0),
}, (table) => [foreignKey({
  columns: [table.userId, table.courseId],
  foreignColumns: [courses.userId, courses.id],
  name: "personal_tasks_course",
}).onUpdate("cascade").onDelete("restrict")])
export const groups = sqliteTable("collab_groups", {
  id: text("id").primaryKey(), title: text("title").notNull(), ownerId: text("owner_id").notNull().references(() => users.id),
  inviteCode: text("invite_code").notNull(), inviteHash: text("invite_hash").notNull().unique(),
  inviteExpiresAt: integer("invite_expires_at").notNull(), createdAt: text("created_at").notNull(),
})
export const members = sqliteTable("collab_members", {
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").$type<"owner" | "member">().notNull(), joinedAt: text("joined_at").notNull(),
}, (table) => [primaryKey({ columns: [table.groupId, table.userId] })])
export const tasks = sqliteTable("collab_tasks", {
  id: text("id").primaryKey(), groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(), courseId: text("course_id").$type<CourseId>().notNull(), dueAt: text("due_at").notNull(), notes: text("notes").notNull(),
  priority: text("priority").$type<TaskPriority>().notNull(), createdBy: text("created_by").notNull().references(() => users.id),
  allMembers: integer("all_members", { mode: "boolean" }).notNull(), createdAt: text("created_at").notNull(),
})
export const assignments = sqliteTable("collab_assignments", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => users.id), status: text("status").$type<TaskStatus>().notNull(),
  progress: integer("progress").notNull(), version: integer("version").notNull(), updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
}, (table) => [primaryKey({ columns: [table.taskId, table.memberId] })])
export const reminders = sqliteTable("collab_reminders", {
  id: text("id").primaryKey(), groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fromId: text("from_id").notNull().references(() => users.id), toId: text("to_id").notNull().references(() => users.id),
  message: text("message").notNull(), createdAt: text("created_at").notNull(), readAt: text("read_at"),
})
export const limits = sqliteTable("collab_limits", {
  key: text("key").primaryKey(), startedAt: integer("started_at").notNull(), count: integer("count").notNull(),
})
