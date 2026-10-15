import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import type { Task, TaskId } from "@/domain"

type TaskProgressInputProps = {
  readonly task: Task
  readonly id?: string
  readonly onProgress: (taskId: TaskId, progress: number) => Promise<boolean>
}

export function TaskProgressInput({ task, id, onProgress }: TaskProgressInputProps) {
  const [draft, setDraft] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const value = draft ?? task.progress
  return <div className="grid gap-2" aria-busy={busy}>
    <div className="flex items-center gap-2"><Slider {...(id ? { id } : {})} className="min-h-11 w-24" aria-label={`Progres ${task.title}`} min={0} max={100} step={10}
      value={[value]} disabled={busy} onValueChange={(values) => { const progress = values[0]; if (progress !== undefined) setDraft(progress) }}
      onValueCommit={(values) => {
        const progress = values[0]
        if (progress === undefined || progress === task.progress) { setDraft(null); return }
        setBusy(true); setFailed(false)
        void onProgress(task.id, progress).then((saved) => setFailed(!saved)).finally(() => { setBusy(false); setDraft(null) })
      }} /><span className="text-xs text-muted-foreground tabular-nums">{value}%</span></div>
    {busy ? <small role="status" className="text-xs text-muted-foreground">Menyimpan progres...</small> : null}
    {failed ? <small role="alert" className="text-xs text-destructive">Progres belum tersimpan. Coba kembali.</small> : null}
  </div>
}
