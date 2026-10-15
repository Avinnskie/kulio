import { ArrowLeft, ArrowRight, CalendarBlank, CheckCircle, PencilSimple } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"
import type { Task, TaskId } from "@/domain"
import { priorityLabel, statusLabel } from "@/domain"
import { useCourses } from "@/courses/Provider"
import { formatDateTime, relativeDeadline } from "@/lib/date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { TaskProgressInput } from "./TaskProgressInput"
import { Label } from "@/components/ui/label"
import { TaskStatusSelect, useTaskActions } from "./TaskActions"

type DayInspection = { readonly kind: "day"; readonly day: Date; readonly taskIds: readonly TaskId[] }
export type TaskInspection = DayInspection | { readonly kind: "task"; readonly taskId: TaskId; readonly sourceDay: DayInspection | null }
type InspectionProps = {
  readonly selection: TaskInspection
  readonly tasks: readonly Task[]
  readonly onSelect: (selection: TaskInspection) => void
  readonly onClose: () => void
  readonly onProgress: (taskId: TaskId, progress: number) => Promise<boolean>
}
const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

export function TaskInspectionDialog({ selection, tasks, onSelect, onClose, onProgress }: InspectionProps) {
  const { courseById } = useCourses()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const originRef = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  useEffect(() => { titleRef.current?.focus() }, [selection])
  const actions = useTaskActions()
  const task = selection.kind === "task" ? tasks.find((item) => item.id === selection.taskId) : undefined
  const dayTasks = selection.kind === "day" ? tasks.filter((item) => selection.taskIds.includes(item.id)).slice().sort((a, b) => a.dueAt.localeCompare(b.dueAt)) : []
  const course = task ? courseById(task.courseId) : null
  const sourceDay = selection.kind === "task" ? selection.sourceDay : null
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={(event) => {
      event.preventDefault()
      if (document.querySelector('[data-slot="dialog-content"]') === null) originRef.current?.focus()
    }}>
      {sourceDay ? <Button variant="ghost" className="w-fit justify-start px-0" onClick={() => onSelect(sourceDay)}><ArrowLeft />Kembali ke daftar hari</Button> : null}
      <div className="space-y-2 pr-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">{selection.kind === "day" ? "Agenda harian" : "Detail tugas"}</span>
        <DialogTitle ref={titleRef} tabIndex={-1} className="break-words leading-snug outline-none">{selection.kind === "day" ? dayFormatter.format(selection.day) : task?.title ?? "Tugas tidak tersedia"}</DialogTitle>
        <DialogDescription>{selection.kind === "day" ? `${dayTasks.length} tugas pada tanggal ini, sesuai pencarian dan filter kalender.` : course?.name ?? "Tugas ini mungkin telah dihapus."}</DialogDescription>
      </div>
      {selection.kind === "day" ? <div className="grid gap-3">
        {dayTasks.length === 0 ? <div className="grid justify-items-center gap-3 rounded-xl bg-muted p-8 text-center"><CalendarBlank className="size-7 text-primary" /><p>Tidak ada tugas untuk hari ini.</p><span className="text-sm text-muted-foreground">Pilih tanggal lain atau sesuaikan pencarian dan filter Anda.</span></div>
          : dayTasks.map((item) => <Button key={item.id} variant="ghost" className="h-auto min-h-16 w-full justify-between gap-3 rounded-xl bg-muted p-4 text-left whitespace-normal" onClick={() => onSelect({ kind: "task", taskId: item.id, sourceDay: selection })}>
            <span className="grid min-w-0 gap-1"><strong className="break-words">{item.title}</strong><span className="text-xs text-muted-foreground">{courseById(item.courseId).name} · {formatDateTime(item.dueAt)}</span><Badge variant="secondary" className="w-fit">{statusLabel(item.status)}</Badge></span><ArrowRight className="shrink-0" />
          </Button>)}
      </div> : task && course ? <>
        <div className="grid gap-4 rounded-xl bg-muted p-4 sm:grid-cols-2">
          <div className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">Deadline</span><strong className="text-sm">{formatDateTime(task.dueAt)}</strong><span className="text-xs text-muted-foreground">{relativeDeadline(task.dueAt)}</span></div>
          <div className="grid gap-2"><span className="text-xs font-medium text-muted-foreground">Prioritas</span><Badge variant="secondary" className={`w-fit rounded-full ${task.priority === "tinggi" ? "bg-danger-soft text-destructive" : task.priority === "sedang" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>{priorityLabel(task.priority)}</Badge></div>
          <div className="grid gap-2"><span className="text-xs font-medium text-muted-foreground">Status</span><TaskStatusSelect task={task} /></div>
          <div className="grid content-start gap-2"><span className="text-xs font-medium text-muted-foreground">Progres</span><strong>{task.progress}%</strong><Progress value={task.progress} aria-label={`Progres ${task.title}`} /></div>
        </div>
        {task.status === "dikerjakan" ? <div className="grid gap-3"><Label htmlFor="detail-progress">Perbarui progres tugas</Label><TaskProgressInput key={task.id} id="detail-progress" task={task} onProgress={onProgress} /></div> : null}
        <section className="grid gap-2"><h3>Catatan tugas</h3><p className="break-words whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed">{task.notes || "Belum ada catatan untuk tugas ini."}</p></section>
        <p className="text-xs text-muted-foreground">Dicatat pada {formatDateTime(task.createdAt)}</p>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => { onClose(); actions.onEdit(task) }}><PencilSimple />Edit tugas</Button>
          <Button onClick={() => actions.onStatusChange(task.id, task.status === "selesai" ? "belum_selesai" : "selesai")}><CheckCircle />{task.status === "selesai" ? "Buka kembali" : "Tandai selesai"}</Button>
        </div>
      </> : null}
    </DialogContent>
  </Dialog>
}
