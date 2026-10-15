import { useState } from "react"
import { toast } from "sonner"
import { useCollaboration } from "@/collaboration/Provider"
import type { SharedTask } from "@/collaboration/domain"
import { CommandSchema } from "@/collaboration/domain"
import { TaskFormSchema } from "@/domain"
import { useCourses } from "@/courses/Provider"
import { toDateInputValue } from "@/lib/date"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SharedTaskDialog({ task, onClose }: { readonly task: SharedTask | null; readonly onClose: () => void }) {
  const { detail, viewer, busy, mutate } = useCollaboration()
  const { courses } = useCourses()
  const [allMembers, setAllMembers] = useState(task?.allMembers ?? true)
  const [selected, setSelected] = useState<string[]>(task?.assignments.map((item) => item.memberId) ?? [])
  if (!detail) return null
  const lockedCourse = task !== null && task.createdBy !== viewer?.id ? task.course : null
  const missingCourse = task === null && courses.length === 0
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 0, 0)
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[40rem] overflow-y-auto">
      <DialogHeader><DialogTitle>{task ? "Edit tugas bersama" : "Tambah tugas bersama"}</DialogTitle>
        <DialogDescription>Setiap anggota mendapatkan status penyelesaian sendiri untuk tugas ini.</DialogDescription></DialogHeader>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault()
        if (missingCourse) { toast.error("Tambahkan mata kuliah dari sidebar terlebih dahulu."); return }
        const parsed = TaskFormSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
        if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Periksa isian tugas."); return }
        if (!allMembers && selected.length === 0) { toast.error("Pilih minimal satu anggota."); return }
        const command = CommandSchema.parse({ type: "save_task", groupId: detail.group.id, taskId: task?.id ?? null,
          ...parsed.data, dueAt: new Date(parsed.data.dueAt).toISOString(), allMembers, memberIds: selected,
        })
        void mutate(command, task ? "Tugas diperbarui" : "Tugas bersama ditambahkan").then((success) => { if (success) onClose() })
      }}>
        <Label htmlFor="shared-title">Judul tugas</Label><Input id="shared-title" name="title" defaultValue={task?.title ?? ""} required minLength={2} maxLength={100} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="shared-course">Mata kuliah</Label>{lockedCourse === null ? <Select name="courseId" defaultValue={task?.courseId ?? courses[0]?.id}>
            <SelectTrigger className="w-full" id="shared-course"><SelectValue /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}><span className="flex items-center gap-2"><CourseColorDot color={course.color} />{course.name}</span></SelectItem>)}</SelectContent>
          </Select> : <><input type="hidden" name="courseId" value={lockedCourse.id} /><Button id="shared-course" type="button" variant="outline" disabled className="w-full justify-start"><CourseColorDot color={lockedCourse.color} />{lockedCourse.name}</Button></>}</div>
          <div className="grid gap-2"><Label htmlFor="shared-priority">Prioritas</Label><Select name="priority" defaultValue={task?.priority ?? "sedang"}>
            <SelectTrigger className="w-full" id="shared-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rendah">Rendah</SelectItem><SelectItem value="sedang">Sedang</SelectItem><SelectItem value="tinggi">Tinggi</SelectItem></SelectContent>
          </Select></div>
        </div>
        <Label htmlFor="shared-due">Deadline</Label><Input id="shared-due" name="dueAt" type="datetime-local" required defaultValue={toDateInputValue(task ? new Date(task.dueAt) : tomorrow)} />
        <Label htmlFor="shared-notes">Catatan</Label><Textarea id="shared-notes" name="notes" defaultValue={task?.notes ?? ""} maxLength={400} placeholder="Ketentuan tugas, tautan LMS, atau catatan kelompok." />
        {missingCourse ? <p className="rounded-lg bg-warning-soft p-3 text-sm text-warning">Belum ada mata kuliah. Tutup dialog ini lalu tambahkan mata kuliah melalui tombol edit di sidebar.</p> : null}
        <fieldset className="grid gap-3 rounded-md border border-border p-4"><legend className="px-2 text-[0.8125rem] font-bold">Siapa yang perlu menyelesaikan?</legend>
          <Label className="min-h-10"><Checkbox checked={allMembers} onCheckedChange={(checked) => setAllMembers(checked === true)} />Semua anggota, termasuk yang bergabung nanti</Label>
          {!allMembers ? detail.members.map((member) => <Label className="min-h-10" key={member.id}><Checkbox checked={selected.includes(member.id)} onCheckedChange={(checked) => setSelected((current) => checked === true ? [...current, member.id] : current.filter((id) => id !== member.id))} />{member.displayName}</Label>) : null}
        </fieldset>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy || missingCourse}>{busy ? "Menyimpan..." : "Simpan tugas bersama"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}
