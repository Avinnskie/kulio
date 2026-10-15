import { Plus, X } from "@phosphor-icons/react"
import { useState } from "react"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCourses } from "@/courses/Provider"
import type { Task, TaskForm } from "../domain"
import { TaskFormSchema } from "../domain"
import { Button, IconButton } from "./Button"
import { TaskDeadlineField } from "./TaskDeadlineField"

type AddTaskDialogProps = {
  readonly open: boolean
  readonly initialTask: Task | null
  readonly onClose: () => void
  readonly onSubmit: (task: TaskForm) => Promise<boolean>
}

export function AddTaskDialog({ open, initialTask, onClose, onSubmit }: AddTaskDialogProps) {
  const { courses } = useCourses()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [deadline, setDeadline] = useState(() => {
    if (initialTask) return new Date(initialTask.dueAt)
    const nextDeadline = new Date()
    nextDeadline.setDate(nextDeadline.getDate() + 1)
    nextDeadline.setHours(23, 59, 0, 0)
    return nextDeadline
  })

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) onClose() }}>
      <DialogContent className="block max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-lg border-border bg-popover p-0 shadow-dialog sm:max-h-[calc(100dvh-2rem)] sm:w-[min(42rem,calc(100vw-2rem))] sm:rounded-xl" showCloseButton={false}>
        <form aria-busy={busy} onSubmit={(event) => {
          event.preventDefault()
          if (busy) return
          const parsed = TaskFormSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Periksa kembali data tugas.")
            return
          }
          setError("")
          setBusy(true)
          void onSubmit(parsed.data).then((saved) => {
            if (!saved) setError("Tugas belum tersimpan. Periksa pesan kesalahan lalu coba lagi.")
          }).finally(() => setBusy(false))
        }}>
          <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider p-4 sm:p-6">
            <span className="grid size-11 place-items-center rounded-md bg-accent text-primary [&_svg]:size-6"><Plus weight="bold" /></span>
            <span>
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-primary">{initialTask ? "Perbarui tugas" : "Tugas baru"}</span>
              <DialogTitle className="text-2xl">{initialTask ? "Rapikan detail tugas" : "Catat sebelum terlupa"}</DialogTitle>
            </span>
            <IconButton icon={<X />} label="Tutup form tugas" onClick={onClose} disabled={busy} />
          </header>
          <DialogDescription className="px-4 pt-5 text-muted-foreground sm:px-6">
            Simpan tugas beserta deadline-nya. Semua perubahan tampil di board dan kalender.
          </DialogDescription>
          <fieldset className="grid min-w-0 gap-4 border-0 px-4 py-5 sm:grid-cols-2 sm:px-6" disabled={busy}>
            <div className="grid min-w-0 gap-2 sm:col-span-2">
              <Label htmlFor="task-title">Judul tugas</Label>
              <Input id="task-title" name="title" defaultValue={initialTask?.title ?? ""}
                maxLength={100} minLength={2} placeholder="Contoh: Laporan praktikum basis data" required />
            </div>
            <div className="grid min-w-0 gap-2 [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full">
              <Label htmlFor="task-course">Mata kuliah</Label>
              <Select name="courseId" defaultValue={initialTask?.courseId ?? courses[0]?.id}>
                <SelectTrigger id="task-course"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {courses.map((course) => <SelectItem key={course.id} value={course.id}><span className="flex items-center gap-2"><CourseColorDot color={course.color} />{course.name}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2 [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full">
              <Label htmlFor="task-priority">Prioritas</Label>
              <Select name="priority" defaultValue={initialTask?.priority ?? "sedang"}>
                <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="rendah">Rendah</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="tinggi">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <TaskDeadlineField
                id="task-deadline"
                name="dueAt"
                deadline={deadline}
                disabled={busy}
                label="Deadline"
                onChange={setDeadline}
              />
            </div>
            <div className="grid min-w-0 gap-2 sm:col-span-2">
              <Label htmlFor="task-notes">Catatan <small className="font-normal text-subtle">Opsional</small></Label>
              <Textarea id="task-notes" name="notes" defaultValue={initialTask?.notes ?? ""} maxLength={400}
                placeholder="Tautan LMS, ketentuan pengumpulan, atau hal penting lainnya." rows={3} />
            </div>
          </fieldset>
          <p className="min-h-6 px-4 text-[0.8125rem] text-destructive sm:px-6" role="alert">{error}</p>
          <footer className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-divider bg-popover px-4 py-4 sm:px-6">
            <Button onClick={onClose} variant="ghost" disabled={busy}>Batal</Button>
            <Button icon={<Plus weight="bold" />} type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan..." : initialTask ? "Simpan perubahan" : "Simpan tugas"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}
