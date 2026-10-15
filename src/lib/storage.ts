import { z } from "zod"
import { toast } from "sonner"
import type { Task } from "../domain"
import { TaskSchema } from "../domain"

const STORAGE_KEY = "ruangtugas.tasks.v1"
const TaskCollectionSchema = z.array(TaskSchema)
const LEGACY_OWNER_KEY = "ruangtugas.tasks.legacy-owner.v1"
const keyFor = (accountId: string) => `ruangtugas.tasks.account.${accountId}.v1`
const pendingKeyFor = (accountId: string) => `ruangtugas.tasks.cloud-import.${accountId}.v1`

export function loadTasks(fallback: readonly Task[], accountId: string): readonly Task[] {
  try {
    const stored = window.localStorage.getItem(keyFor(accountId))
    if (stored === null) return fallback
    const parsedJson: unknown = JSON.parse(stored)
    const parsed = TaskCollectionSchema.safeParse(parsedJson)
    return parsed.success ? parsed.data : fallback
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof DOMException) return fallback
    throw error
  }
}

export function saveTasks(tasks: readonly Task[], accountId: string): void {
  window.localStorage.setItem(keyFor(accountId), JSON.stringify(tasks))
}

export function importBrowserTasks(accountId: string): void {
  try {
    const owner = window.localStorage.getItem(LEGACY_OWNER_KEY)
    if (owner !== null && owner !== accountId) { toast.info("Tugas lama browser ini sudah terhubung ke akun lain."); return }
    if (window.localStorage.getItem(keyFor(accountId)) !== null) return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) return
    const raw: unknown = JSON.parse(stored)
    const parsed = TaskCollectionSchema.safeParse(raw)
    if (!parsed.success) { toast.warning("Data tugas lama tidak dapat diimpor. Salinan lama tetap tersimpan."); return }
    window.localStorage.setItem(keyFor(accountId), JSON.stringify(parsed.data))
    window.localStorage.setItem(pendingKeyFor(accountId), JSON.stringify(parsed.data))
    window.localStorage.setItem(LEGACY_OWNER_KEY, accountId)
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof DOMException) { toast.warning("Tugas lama belum dapat diimpor. Akun tetap berhasil dibuat."); return }
    throw error
  }
}

export function pendingBrowserImport(accountId: string): readonly Task[] | null {
  try {
    const stored = window.localStorage.getItem(pendingKeyFor(accountId))
    if (stored === null) return null
    const raw: unknown = JSON.parse(stored)
    return TaskCollectionSchema.parse(raw)
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof DOMException || error instanceof z.ZodError) {
      toast.warning("Salinan tugas lama belum dapat dibaca. Data aslinya tetap tersimpan."); return null
    }
    throw error
  }
}

export function finishBrowserImport(accountId: string): void {
  try { window.localStorage.removeItem(pendingKeyFor(accountId)) }
  catch (error: unknown) {
    if (error instanceof DOMException) { toast.warning("Impor selesai; penanda browser belum dapat diperbarui."); return }
    throw error
  }
}
