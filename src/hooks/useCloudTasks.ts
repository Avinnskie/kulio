import { useCallback, useEffect, useRef, useState } from "react"
import { HTTPError } from "ky"
import { toast } from "sonner"
import { useAuth } from "@/auth/Provider"
import { finishBrowserImport, pendingBrowserImport } from "@/lib/storage"
import { fetchTaskSnapshot, sendTaskCommand, taskErrorMessage } from "@/tasks/cloud"
import type { PersonalCommand, TaskSnapshot } from "@/tasks/domain"

export function useCloudTasks(accountId: string) {
  const { refresh: refreshAccount } = useAuth()
  const [snapshot, setSnapshot] = useState<TaskSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const current = useRef<TaskSnapshot | null>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const pending = useRef(0)
  const sequence = useRef(0)
  const mounted = useRef(false)

  const commit = useCallback((value: TaskSnapshot) => {
    current.current = value
    if (mounted.current) { setSnapshot(value); setError(null); setLoading(false) }
  }, [])

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (pending.current > 0) return
    const requestId = ++sequence.current
    try {
      const value = await fetchTaskSnapshot(signal)
      if (signal?.aborted || requestId !== sequence.current) return
      const legacy = pendingBrowserImport(accountId)
      if (legacy !== null) {
        const imported = await sendTaskCommand({ type: "import", tasks: [...legacy] })
        if (signal?.aborted || requestId !== sequence.current) return
        finishBrowserImport(accountId)
        commit(imported)
      } else commit(value)
    } catch (caught: unknown) {
      if (signal?.aborted || requestId !== sequence.current) return
      if (caught instanceof HTTPError && caught.response.status === 401) void refreshAccount()
      if (mounted.current) { setError(taskErrorMessage(caught)); setLoading(false) }
    }
  }, [accountId, commit, refreshAccount])

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    void refresh(controller.signal)
    const onFocus = () => { if (current.current !== null) void refresh(controller.signal) }
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") onFocus() }, 10_000)
    window.addEventListener("focus", onFocus)
    return () => { mounted.current = false; controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [refresh])

  const mutate = useCallback((build: (value: TaskSnapshot) => PersonalCommand | null, successMessage?: string) => {
    pending.current += 1
    ++sequence.current
    setBusy(true)
    const operation = queue.current.then(async () => {
      try {
        if (!mounted.current) return false
        const value = current.current
        const command = value ? build(value) : null
        if (!command) { toast.error("Tugas belum tersedia atau sudah dihapus. Muat ulang data."); return false }
        const result = await sendTaskCommand(command)
        commit(result)
        if (mounted.current && successMessage) toast.success(successMessage)
        return true
      } catch (caught: unknown) {
        if (mounted.current) {
          toast.error(taskErrorMessage(caught)); setError(taskErrorMessage(caught))
          if (caught instanceof HTTPError && caught.response.status === 401) void refreshAccount()
          if (caught instanceof HTTPError && caught.response.status === 409) {
            try { commit(await fetchTaskSnapshot()) }
            catch (refreshError: unknown) { setError(taskErrorMessage(refreshError)) }
          }
        }
        return false
      } finally {
        pending.current -= 1
        if (mounted.current) setBusy(pending.current > 0)
      }
    })
    queue.current = operation.then(() => undefined)
    return operation
  }, [commit, refreshAccount])

  return { tasks: snapshot?.tasks ?? [], courses: snapshot?.courses ?? [], loading, ready: snapshot !== null, busy, error, refresh, mutate }
}
