import { PencilSimple, Plus, Trash, X } from "@phosphor-icons/react"
import { useState } from "react"
import type { Course, CourseDraft } from "@/domain"
import { CourseDraftSchema, DEFAULT_COURSE_COLOR } from "@/domain"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SolidColorPicker } from "@/components/ui/solid-color-picker"

type CourseManagerDialogProps = {
  readonly open: boolean
  readonly courses: readonly Course[]
  readonly busy: boolean
  readonly onClose: () => void
  readonly onSave: (form: CourseDraft, existing: Course | null) => Promise<boolean>
  readonly onDelete: (course: Course) => Promise<boolean>
}

export function CourseManagerDialog({ open, courses, busy, onClose, onSave, onDelete }: CourseManagerDialogProps) {
  const [editing, setEditing] = useState<Course | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)
  const [color, setColor] = useState<string>(DEFAULT_COURSE_COLOR)
  const [error, setError] = useState("")
  const resetEditor = () => {
    setEditing(null)
    setColor(DEFAULT_COURSE_COLOR)
    setError("")
  }

  return <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) { resetEditor(); setPendingDelete(null); onClose() } }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Kelola mata kuliah</DialogTitle>
        <DialogDescription>Nama, singkatan, dan warna akan langsung dipakai oleh tugas Anda.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2" aria-label="Daftar mata kuliah">
        {courses.map((course) => <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3" key={course.id}>
          <CourseColorDot color={course.color} className="size-3" />
          <span className="grid min-w-0 flex-1">
            <strong className="truncate">{course.name}</strong>
            <small className="text-xs text-muted-foreground">{course.shortName}</small>
          </span>
          <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${course.name}`} disabled={busy} onClick={() => { setEditing(course); setPendingDelete(null); setColor(course.color); setError("") }}><PencilSimple /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Hapus ${course.name}`} disabled={busy} onClick={() => { setPendingDelete(course); resetEditor() }}><Trash /></Button>
        </div>)}
      </div>

      {pendingDelete ? <section className="grid gap-3 rounded-lg border border-destructive/40 bg-danger-soft p-4" aria-labelledby="delete-course-title">
        <div className="flex items-start justify-between gap-3">
          <div><h3 id="delete-course-title">Hapus {pendingDelete.name}?</h3><p className="mt-1 text-sm text-muted-foreground">Mata kuliah yang masih dipakai tugas tidak dapat dihapus.</p></div>
          <Button type="button" variant="ghost" size="icon" aria-label="Batalkan hapus mata kuliah" onClick={() => setPendingDelete(null)}><X /></Button>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setPendingDelete(null)}>Batal</Button><Button type="button" variant="destructive" disabled={busy} onClick={() => { void onDelete(pendingDelete).then((saved) => { if (saved) setPendingDelete(null) }) }}>{busy ? "Menghapus..." : "Hapus mata kuliah"}</Button></div>
      </section> : <form key={editing?.id ?? "new-course"} className="grid gap-4 rounded-lg border border-border p-4" onSubmit={(event) => {
        event.preventDefault()
        if (busy) return
        const parsed = CourseDraftSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Periksa data mata kuliah."); return }
        setError("")
        void onSave(parsed.data, editing).then((saved) => { if (saved) resetEditor() })
      }}>
        <div className="flex items-center justify-between gap-3"><h3>{editing ? "Edit mata kuliah" : "Tambah mata kuliah"}</h3>{editing ? <Button type="button" variant="ghost" size="sm" onClick={resetEditor}>Batal edit</Button> : null}</div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="grid gap-2"><Label htmlFor="course-name">Nama mata kuliah</Label><Input id="course-name" name="name" defaultValue={editing?.name ?? ""} minLength={2} maxLength={60} placeholder="Contoh: Algoritma" required /></div>
          <div className="grid gap-2"><Label htmlFor="course-short-name">Singkatan</Label><Input id="course-short-name" name="shortName" defaultValue={editing?.shortName ?? ""} minLength={2} maxLength={8} placeholder="ALG" required /></div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-color">Warna khusus</Label>
          <SolidColorPicker id="course-color" name="color" value={color} disabled={busy} onChange={setColor} />
          <small className="text-xs text-muted-foreground">Atur warna visual, hue, atau kode HEX lalu simpan warna favorit untuk dipakai kembali.</small>
        </div>
        <p className="min-h-5 text-sm text-destructive" role="alert">{error}</p>
        <div className="flex justify-end"><Button type="submit" disabled={busy}><Plus />{busy ? "Menyimpan..." : editing ? "Simpan perubahan" : "Tambah mata kuliah"}</Button></div>
      </form>}
      <Badge variant="secondary" className="w-fit">{courses.length} mata kuliah</Badge>
    </DialogContent>
  </Dialog>
}
