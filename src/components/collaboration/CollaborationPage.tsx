import { useState } from "react"
import { ArrowsClockwise, Plus, UsersThree } from "@phosphor-icons/react"
import { useCollaboration } from "@/collaboration/Provider"
import type { AssignmentRow, SharedTask } from "@/collaboration/domain"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { RoomDialogs } from "./RoomDialogs"
import { InvitationCard } from "./InvitationCard"
import { MemberWorkspaceOverview } from "./MemberWorkspaceOverview"
import { AssignmentsTable } from "./AssignmentsTable"
import { SharedTaskDialog } from "./SharedTaskDialog"
import { ReminderDialog } from "./ReminderDialog"

export function CollaborationPage({ search }: { readonly search: string }) {
  const { viewer, groups, detail, selectedGroup, setSelectedGroup, loading, error, busy, refresh, mutate } = useCollaboration()
  const [roomMode, setRoomMode] = useState<"create" | "join" | null>(() => new URL(window.location.href).searchParams.has("invite") ? "join" : null)
  const [taskDialog, setTaskDialog] = useState<{ task: SharedTask | null } | null>(null)
  const [reminderRow, setReminderRow] = useState<AssignmentRow | null>(null)
  const [deleting, setDeleting] = useState<SharedTask | null>(null)
  const [memberFilter, setMemberFilter] = useState("semua")

  return <div className="mx-auto max-w-[93.75rem]">
    <section className="flex flex-col items-stretch justify-between gap-6 py-4 pb-6 md:flex-row md:items-end md:py-5 md:pb-8"><div><span className="text-xs font-bold uppercase tracking-[0.06em] text-primary">Saling bantu, saling pantau</span><h1 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em]">Ruang kolaborasi</h1><p className="mt-2 text-base text-muted-foreground md:text-[1.0625rem]">Lihat mata kuliah, tugas, dan deadline setiap anggota dalam satu ruang.</p></div>
      {viewer ? <div className="flex flex-wrap items-center gap-2 md:justify-end"><Button variant="outline" onClick={() => setRoomMode("join")}>Gabung dengan kode</Button><Button onClick={() => setRoomMode("create")}><Plus />Buat ruang</Button></div> : null}
    </section>
    {error ? <div className="mb-4 flex flex-col items-start justify-between gap-4 rounded-md bg-danger-soft p-4 text-destructive md:flex-row md:items-center" role="alert"><span>{error}</span><Button variant="outline" onClick={() => void refresh()}>Coba kembali</Button></div> : null}
    {loading ? <Card className="grid place-items-center gap-4 px-6 py-12 text-center" role="status">Memuat ruang kolaborasi...</Card> : !viewer && !error ? <Card className="grid place-items-center gap-4 px-6 py-12 text-center" role="status">Menghubungkan akun ke ruang kolaborasi...</Card> : null}
    {viewer ? <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={selectedGroup ?? ""} onValueChange={(id) => { setSelectedGroup(id); setMemberFilter("semua") }}>
          <SelectTrigger className="min-h-11 min-w-[min(20rem,100%)] bg-card" aria-label="Pilih ruang kolaborasi"><SelectValue placeholder="Pilih ruang bersama" /></SelectTrigger>
          <SelectContent>{groups.map((group) => <SelectItem value={group.id} key={group.id}>{group.title} · {group.memberCount} anggota</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="ghost" disabled={busy} onClick={() => void refresh()}><ArrowsClockwise />Perbarui</Button>
        <small className="text-xs text-muted-foreground md:ml-auto">Perubahan diperbarui otomatis setiap 10 detik.</small>
      </div>
      {!selectedGroup ? <Card className="grid place-items-center gap-4 px-6 py-12 text-center [&>svg]:size-10 [&>svg]:text-primary"><UsersThree /><h2 className="text-xl font-bold">{groups.length ? "Pilih ruang belajar Anda" : "Ruang pertama dimulai dari Anda"}</h2><p className="text-muted-foreground">Buat ruang dan bagikan kode agar setiap anggota dapat saling melihat mata kuliah, tugas, serta deadline.</p><Button onClick={() => setRoomMode(groups.length ? "join" : "create")}>{groups.length ? "Gabung ruang lain" : "Buat ruang pertama"}</Button></Card>
        : detail?.group.id === selectedGroup ? <>
          <InvitationCard /><MemberWorkspaceOverview search={search} />
          <Card className="min-w-0 gap-0 overflow-hidden border-border p-0 shadow-none">
            <div className="flex flex-col items-stretch justify-between gap-4 p-5 md:flex-row md:items-center"><div><span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Koordinasi tambahan</span><h2 className="mt-1 text-xl font-bold">Tugas bersama · {detail.group.title}</h2><p className="mt-2 text-[0.8125rem] text-muted-foreground">Bagikan satu tugas kepada beberapa anggota dan pantau status masing-masing.</p></div><Button onClick={() => setTaskDialog({ task: null })}><Plus />Tambah tugas bersama</Button></div>
            <div className="px-5 pb-2"><Select value={memberFilter} onValueChange={setMemberFilter}><SelectTrigger aria-label="Filter anggota"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="semua">Semua anggota</SelectItem>{detail.members.map((member) => <SelectItem value={member.id} key={member.id}>{member.displayName}{member.id === viewer.id ? " (Anda)" : ""}</SelectItem>)}</SelectContent></Select></div>
            <AssignmentsTable memberFilter={memberFilter} search={search} onEdit={(task) => setTaskDialog({ task })} onDelete={setDeleting} onRemind={setReminderRow} />
          </Card>
        </> : <Card className="grid place-items-center gap-4 px-6 py-12 text-center" role="status">Memuat tugas dan anggota ruang...</Card>}
      <RoomDialogs mode={roomMode} onClose={() => setRoomMode(null)} />
      {taskDialog ? <SharedTaskDialog key={taskDialog.task?.id ?? "new"} task={taskDialog.task} onClose={() => setTaskDialog(null)} /> : null}
      {reminderRow ? <ReminderDialog row={reminderRow} onClose={() => setReminderRow(null)} /> : null}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open && !busy) setDeleting(null) }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus tugas bersama?</AlertDialogTitle><AlertDialogDescription>“{deleting?.title}” beserta progres semua anggota akan dihapus dari ruang ini.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => {
            event.preventDefault()
            if (deleting && detail) void mutate({ type: "delete_task", groupId: detail.group.id, taskId: deleting.id }, "Tugas bersama dihapus").then((success) => { if (success) setDeleting(null) })
          }}>Hapus tugas</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </> : null}
  </div>
}
