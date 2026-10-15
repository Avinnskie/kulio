import { z } from "zod"
import { CourseIdSchema, CourseSchema, TaskIdSchema, TaskSchema } from "@/domain"

export const TaskSnapshotSchema = z.object({
  tasks: z.array(TaskSchema),
  versions: z.record(z.string(), z.number().int().min(0)),
  courses: z.array(CourseSchema),
})
export const PersonalCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("save"), task: TaskSchema, expectedVersion: z.number().int().min(0).nullable() }),
  z.object({ type: z.literal("save_many"), tasks: z.array(TaskSchema).min(1).max(100) }),
  z.object({ type: z.literal("delete"), taskId: TaskIdSchema, expectedVersion: z.number().int().min(0) }),
  z.object({ type: z.literal("import"), tasks: z.array(TaskSchema).max(500) }),
  z.object({ type: z.literal("save_course"), course: CourseSchema }),
  z.object({ type: z.literal("delete_course"), courseId: CourseIdSchema }),
])
export type TaskSnapshot = z.infer<typeof TaskSnapshotSchema>
export type PersonalCommand = z.infer<typeof PersonalCommandSchema>
