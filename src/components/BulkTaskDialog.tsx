import { ListPlus, Plus, StackPlus, Trash, X } from "@phosphor-icons/react"
import { useState } from "react"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCourses } from "@/courses/Provider"
import {
  BulkTaskFormsSchema,
  CourseIdSchema,
  TaskPrioritySchema,
  type CourseId,
  type TaskForm,
  type TaskPriority,
} from "../domain"
import { toDateInputValue } from "../lib/date"
import { Button, IconButton } from "./Button"
import { TaskDeadlineField } from "./TaskDeadlineField"

const MAX_MANUAL_TASKS = 25

type BulkTaskRow = {
  readonly id: string
  readonly title: string
  readonly deadline: Date
  readonly priority: TaskPriority
  readonly notes: string
}

type BulkTaskDialogProps = {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSubmit: (tasks: readonly TaskForm[]) => Promise<boolean>
}

function defaultDeadline(): Date {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 1)
  deadline.setHours(23, 59, 0, 0)
  return deadline
}

function createRow(deadline = defaultDeadline()): BulkTaskRow {
  return {
    id: crypto.randomUUID(),
    title: "",
    deadline: new Date(deadline),
    priority: "sedang",
    notes: "",
  }
}

export function BulkTaskDialog({ open, onClose, onSubmit }: BulkTaskDialogProps) {
  const { courses } = useCourses()
  const [courseId, setCourseId] = useState<CourseId | "">(() => courses[0]?.id ?? "")
  const [rows, setRows] = useState<readonly BulkTaskRow[]>(() => [createRow(), createRow()])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const updateRow = (rowId: string, change: (row: BulkTaskRow) => BulkTaskRow) => {
    setRows((current) => current.map((row) => row.id === rowId ? change(row) : row))
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) onClose() }}>
      <DialogContent
        className="block max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto rounded-md border-border bg-popover p-0 shadow-dialog sm:max-h-[calc(100dvh-2rem)] sm:w-[min(68rem,calc(100vw-2rem))] sm:max-w-none dark:rounded-xl"
        showCloseButton={false}
      >
        <form
          aria-busy={busy}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (busy) return
            const parsed = BulkTaskFormsSchema.safeParse(rows.map((row) => ({
              title: row.title,
              courseId,
              dueAt: toDateInputValue(row.deadline),
              priority: row.priority,
              notes: row.notes,
            })))
            if (!parsed.success) {
              const issue = parsed.error.issues[0]
              const rowIndex = issue?.path[0]
              const prefix = typeof rowIndex === "number" ? `Tugas ${rowIndex + 1}: ` : ""
              setError(`${prefix}${issue?.message ?? "Periksa kembali daftar tugas."}`)
              return
            }
            setError("")
            setBusy(true)
            void onSubmit(parsed.data).then((saved) => {
              if (!saved) setError("Daftar tugas belum tersimpan. Periksa pesan kesalahan lalu coba lagi.")
            }).finally(() => setBusy(false))
          }}
        >
          <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider p-4 sm:p-6">
            <span className="grid size-11 place-items-center rounded-md bg-accent text-primary [&_svg]:size-6"><StackPlus weight="bold" /></span>
            <span>
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-primary">Tambah banyak</span>
              <DialogTitle className="text-2xl">Susun tugas satu mata kuliah</DialogTitle>
            </span>
            <IconButton icon={<X />} label="Tutup form tugas massal" onClick={onClose} disabled={busy} />
          </header>
          <DialogDescription className="px-4 pt-5 text-muted-foreground sm:px-6">
            Pilih mata kuliah, lalu tambahkan seluruh tugasnya. Semua baris disimpan bersamaan agar tidak ada data yang tertinggal.
          </DialogDescription>
          <fieldset className="grid min-w-0 gap-5 border-0 px-4 py-5 sm:px-6" disabled={busy}>
            <div className="grid gap-2 rounded-md bg-secondary p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="grid min-w-0 gap-2 [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full">
                <Label htmlFor="bulk-task-course">Mata kuliah untuk seluruh tugas</Label>
                <Select
                  value={courseId}
                  onValueChange={(value) => {
                    const parsed = CourseIdSchema.safeParse(value)
                    if (parsed.success) setCourseId(parsed.data)
                  }}
                >
                  <SelectTrigger id="bulk-task-course"><SelectValue placeholder="Pilih mata kuliah" /></SelectTrigger>
                  <SelectContent position="popper">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <span className="flex items-center gap-2"><CourseColorDot color={course.color} />{course.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground sm:pb-3" aria-live="polite">{rows.length} dari {MAX_MANUAL_TASKS} tugas</span>
            </div>
            <div className="grid gap-3" aria-label="Daftar tugas baru">
              {rows.map((row, index) => {
                const rowNumber = index + 1
                return (
                  <fieldset className="grid min-w-0 gap-4 rounded-md border border-border bg-card p-4" key={row.id}>
                    <legend className="sr-only">Tugas {rowNumber}</legend>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="flex items-center gap-2 text-sm"><span className="grid size-7 place-items-center rounded-full bg-secondary text-xs tabular-nums">{rowNumber}</span>Tugas {rowNumber}</strong>
                      <IconButton
                        icon={<Trash />}
                        label={`Hapus tugas ${rowNumber}`}
                        disabled={busy || rows.length === 1}
                        onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                      />
                    </div>
                    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)_10rem]">
                      <div className="grid min-w-0 gap-2">
                        <Label htmlFor={`bulk-task-title-${row.id}`}>Judul tugas {rowNumber}</Label>
                        <Input
                          id={`bulk-task-title-${row.id}`}
                          value={row.title}
                          maxLength={100}
                          minLength={2}
                          placeholder="Contoh: Laporan praktikum"
                          required
                          onChange={(event) => updateRow(row.id, (current) => ({ ...current, title: event.currentTarget.value }))}
                        />
                      </div>
                      <TaskDeadlineField
                        id={`bulk-task-deadline-${row.id}`}
                        deadline={row.deadline}
                        disabled={busy}
                        label={`Deadline tugas ${rowNumber}`}
                        onChange={(deadline) => updateRow(row.id, (current) => ({ ...current, deadline }))}
                      />
                      <div className="grid min-w-0 gap-2 [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:w-full">
                        <Label htmlFor={`bulk-task-priority-${row.id}`}>Prioritas tugas {rowNumber}</Label>
                        <Select
                          value={row.priority}
                          onValueChange={(value) => {
                            const parsed = TaskPrioritySchema.safeParse(value)
                            if (parsed.success) updateRow(row.id, (current) => ({ ...current, priority: parsed.data }))
                          }}
                        >
                          <SelectTrigger id={`bulk-task-priority-${row.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="rendah">Rendah</SelectItem>
                            <SelectItem value="sedang">Sedang</SelectItem>
                            <SelectItem value="tinggi">Tinggi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-2">
                      <Label htmlFor={`bulk-task-notes-${row.id}`}>Catatan tugas {rowNumber} <small className="font-normal text-subtle">Opsional</small></Label>
                      <Textarea
                        id={`bulk-task-notes-${row.id}`}
                        value={row.notes}
                        maxLength={400}
                        placeholder="Tautan LMS atau ketentuan pengumpulan."
                        rows={2}
                        onChange={(event) => updateRow(row.id, (current) => ({ ...current, notes: event.currentTarget.value }))}
                      />
                    </div>
                  </fieldset>
                )
              })}
            </div>
            <Button
              icon={<Plus weight="bold" />}
              className="w-full border-dashed"
              variant="secondary"
              disabled={busy || rows.length >= MAX_MANUAL_TASKS}
              onClick={() => setRows((current) => [...current, createRow(current.at(-1)?.deadline)])}
            >
              {rows.length >= MAX_MANUAL_TASKS ? "Batas 25 tugas tercapai" : "Tambah baris tugas"}
            </Button>
          </fieldset>
          <p className="min-h-6 px-4 text-[0.8125rem] text-destructive sm:px-6" role="alert">{error}</p>
          <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-divider bg-popover px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><ListPlus className="size-4" />Satu penyimpanan untuk seluruh daftar</span>
            <span className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button onClick={onClose} variant="ghost" disabled={busy}>Batal</Button>
              <Button icon={<StackPlus weight="bold" />} type="submit" variant="primary" disabled={busy}>
                {busy ? "Menyimpan daftar..." : `Simpan ${rows.length} tugas`}
              </Button>
            </span>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}
