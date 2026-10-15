import ky, { HTTPError } from "ky"
import { z } from "zod"
import { TaskSnapshotSchema, type PersonalCommand } from "./domain"

const api = ky.create({ timeout: 20_000, retry: 0, credentials: "same-origin" })
const ErrorSchema = z.object({ error: z.string() })

export async function fetchTaskSnapshot(signal?: AbortSignal) {
  const raw: unknown = await api.get("/api/tasks", signal ? { signal } : {}).json()
  return TaskSnapshotSchema.parse(raw)
}

export async function sendTaskCommand(command: PersonalCommand) {
  const raw: unknown = await api.post("/api/tasks", { json: command }).json()
  return TaskSnapshotSchema.parse(raw)
}

export function taskErrorMessage(error: unknown) {
  if (error instanceof HTTPError) {
    const parsed = ErrorSchema.safeParse(error.data)
    return parsed.success ? parsed.data.error : "Permintaan penyimpanan tugas gagal."
  }
  if (error instanceof z.ZodError) return "Format data tugas dari server belum sesuai."
  return "Tugas belum dapat disinkronkan. Periksa koneksi Anda lalu coba kembali."
}
