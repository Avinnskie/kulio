import { z } from "zod";

export const TASK_STATUSES = [
    "belum_selesai",
    "dikerjakan",
    "selesai",
] as const;
export const TASK_PRIORITIES = ["rendah", "sedang", "tinggi"] as const;
export const VIEW_MODES = ["board", "tabel", "kalender"] as const;
export const APP_SECTIONS = [
    "ringkasan",
    "semua",
    "kalender",
    "arsip",
    "kolaborasi",
] as const;
export const THEMES = ["system", "light", "dark"] as const;
export const DEFAULT_COURSE_COLOR = "#2F6B47" as const;

export const TaskIdSchema = z.string().uuid().brand("TaskId");
export const CourseIdSchema = z.string().min(1).max(80).brand("CourseId");
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const TaskPrioritySchema = z.enum(TASK_PRIORITIES);
export const CourseColorSchema = z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Gunakan warna HEX dengan format #RRGGBB.")
    .transform((value) => value.toUpperCase());
export const CourseSchema = z.object({
    id: CourseIdSchema,
    name: z.string().min(2).max(60),
    shortName: z.string().min(2).max(8),
    color: CourseColorSchema,
});
export const CourseDraftSchema = CourseSchema.omit({ id: true }).extend({
    name: z
        .string()
        .trim()
        .min(2, "Nama mata kuliah minimal 2 karakter.")
        .max(60),
    shortName: z.string().trim().min(2, "Singkatan minimal 2 karakter.").max(8),
});

export const TaskSchema = z.object({
    id: TaskIdSchema,
    title: z.string().min(1).max(100),
    courseId: CourseIdSchema,
    dueAt: z.iso.datetime(),
    status: TaskStatusSchema,
    priority: TaskPrioritySchema,
    progress: z.number().int().min(0).max(100),
    notes: z.string().max(400),
    createdAt: z.iso.datetime(),
});

export const TaskFormSchema = z.object({
    title: z.string().trim().min(2, "Judul tugas minimal 2 karakter.").max(100),
    courseId: CourseIdSchema,
    dueAt: z
        .string()
        .min(1, "Pilih tanggal dan jam deadline.")
        .refine(
            (value) => Number.isFinite(new Date(value).getTime()),
            "Tanggal deadline tidak valid.",
        ),
    priority: TaskPrioritySchema,
    notes: z.string().trim().max(400),
});
export const BulkTaskFormsSchema = z
    .array(TaskFormSchema)
    .min(1, "Tambahkan setidaknya satu tugas.")
    .max(100, "Maksimal 100 tugas dalam sekali penyimpanan.");

export type Task = z.infer<typeof TaskSchema>;
export type TaskId = z.infer<typeof TaskIdSchema>;
export type CourseId = z.infer<typeof CourseIdSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskForm = z.infer<typeof TaskFormSchema>;
export type ViewMode = (typeof VIEW_MODES)[number];
export type AppSection = (typeof APP_SECTIONS)[number];
export type ThemeChoice = (typeof THEMES)[number];
export type Course = z.infer<typeof CourseSchema>;
export type CourseDraft = z.infer<typeof CourseDraftSchema>;

export function assertNever(value: never): never {
    throw new TypeError(`Varian tidak dikenal: ${String(value)}`);
}

export function nextStatus(status: TaskStatus): TaskStatus {
    switch (status) {
        case "belum_selesai":
            return "dikerjakan";
        case "dikerjakan":
            return "selesai";
        case "selesai":
            return "belum_selesai";
        default:
            return assertNever(status);
    }
}

export function statusLabel(status: TaskStatus): string {
    switch (status) {
        case "belum_selesai":
            return "Belum selesai";
        case "dikerjakan":
            return "Dikerjakan";
        case "selesai":
            return "Selesai";
        default:
            return assertNever(status);
    }
}

export function priorityLabel(priority: TaskPriority): string {
    switch (priority) {
        case "rendah":
            return "Rendah";
        case "sedang":
            return "Sedang";
        case "tinggi":
            return "Tinggi";
        default:
            return assertNever(priority);
    }
}

export function progressForStatus(status: TaskStatus, current: number): number {
    switch (status) {
        case "belum_selesai":
            return 0;
        case "dikerjakan":
            return current > 0 && current < 100 ? current : 50;
        case "selesai":
            return 100;
        default:
            return assertNever(status);
    }
}
