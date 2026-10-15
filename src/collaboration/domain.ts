import { z } from "zod"
import { TaskStatusSchema, TaskPrioritySchema, CourseIdSchema, CourseSchema, TaskSchema } from "@/domain"

export const ViewerSchema = z.object({ id: z.uuid(), displayName: z.string() })
export const MemberSchema = ViewerSchema.extend({ role: z.enum(["owner", "member"]), joinedAt: z.string() })
export const GroupSchema = z.object({
  id: z.uuid(), title: z.string(), role: z.enum(["owner", "member"]),
  memberCount: z.number(), taskCount: z.number(), inviteCode: z.string().nullable(), inviteExpiresAt: z.string().nullable(),
})
export const AssignmentSchema = z.object({
  memberId: z.uuid(), status: TaskStatusSchema, progress: z.number(), version: z.number(), updatedAt: z.string(), updatedBy: z.uuid(),
})
export const SharedTaskSchema = z.object({
  id: z.uuid(), title: z.string(), courseId: CourseIdSchema, course: CourseSchema, dueAt: z.iso.datetime(), notes: z.string(),
  priority: TaskPrioritySchema, createdBy: z.uuid(), allMembers: z.boolean(), assignments: z.array(AssignmentSchema),
})
export const InboxItemSchema = z.object({
  id: z.uuid(), groupId: z.uuid(), groupTitle: z.string(), taskTitle: z.string(), fromName: z.string(),
  message: z.string(), createdAt: z.string(), readAt: z.string().nullable(),
})
export const MemberTaskSchema = TaskSchema.pick({
  id: true,
  title: true,
  courseId: true,
  dueAt: true,
  status: true,
  priority: true,
  progress: true,
})
export const MemberWorkspaceSchema = z.object({
  memberId: z.uuid(),
  courses: z.array(CourseSchema),
  tasks: z.array(MemberTaskSchema),
})
export const GroupDetailSchema = z.object({
  group: GroupSchema,
  members: z.array(MemberSchema),
  memberWorkspaces: z.array(MemberWorkspaceSchema),
  tasks: z.array(SharedTaskSchema),
})
export const WorkspaceSchema = z.object({
  viewer: ViewerSchema.nullable(), groups: z.array(GroupSchema), inbox: z.array(InboxItemSchema), detail: GroupDetailSchema.nullable(),
})

const GroupId = z.uuid()
const SharedTaskFields = {
  groupId: GroupId, taskId: z.uuid().nullable(), title: z.string().trim().min(2).max(100),
  courseId: CourseIdSchema,
  dueAt: z.iso.datetime(), notes: z.string().trim().max(400), priority: TaskPrioritySchema,
  allMembers: z.boolean(), memberIds: z.array(z.uuid()).max(100),
}
export const CommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create_group"), title: z.string().trim().min(2).max(80) }),
  z.object({ type: z.literal("join_group"), code: z.string().trim().transform((value) => value.replace(/[-\s]/g, "").toUpperCase()).pipe(z.string().regex(/^[A-F0-9]{16}$/)) }),
  z.object({ type: z.literal("rotate_invite"), groupId: GroupId }),
  z.object({ type: z.literal("save_task"), ...SharedTaskFields }),
  z.object({ type: z.literal("delete_task"), groupId: GroupId, taskId: z.uuid() }),
  z.object({ type: z.literal("update_assignment"), groupId: GroupId, taskId: z.uuid(), memberId: z.uuid(), status: TaskStatusSchema, expectedVersion: z.number().int().min(0) }),
  z.object({ type: z.literal("remind"), groupId: GroupId, taskId: z.uuid(), memberId: z.uuid(), message: z.string().trim().min(1).max(300) }),
  z.object({ type: z.literal("read_reminder"), reminderId: z.uuid() }),
])
export const MutationResultSchema = z.object({ ok: z.literal(true), groupId: z.uuid().optional() })
export type Viewer = z.infer<typeof ViewerSchema>
export type Group = z.infer<typeof GroupSchema>
export type GroupDetail = z.infer<typeof GroupDetailSchema>
export type MemberTask = z.infer<typeof MemberTaskSchema>
export type MemberWorkspace = z.infer<typeof MemberWorkspaceSchema>
export type SharedTask = z.infer<typeof SharedTaskSchema>
export type Assignment = z.infer<typeof AssignmentSchema>
export type InboxItem = z.infer<typeof InboxItemSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
export type Command = z.infer<typeof CommandSchema>
export type AssignmentRow = { readonly task: SharedTask; readonly member: z.infer<typeof MemberSchema>; readonly assignment: Assignment }
