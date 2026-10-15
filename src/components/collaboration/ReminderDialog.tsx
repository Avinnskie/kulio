import { useCollaboration } from "@/collaboration/Provider"
import type { AssignmentRow } from "@/collaboration/domain"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ReminderDialog({ row, onClose }: { readonly row: AssignmentRow; readonly onClose: () => void }) {
  const { detail, busy, mutate } = useCollaboration()
  if (!detail) return null
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <DialogContent><DialogHeader><DialogTitle>Ingatkan {row.member.displayName}</DialogTitle>
      <DialogDescription>Pengingat untuk “{row.task.title}” akan muncul di kotak masuk anggota ini.</DialogDescription></DialogHeader>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault()
        const message = new FormData(event.currentTarget).get("message")
        if (typeof message === "string") void mutate({ type: "remind", groupId: detail.group.id, taskId: row.task.id, memberId: row.member.id, message }, "Pengingat dikirim").then((success) => { if (success) onClose() })
      }}>
        <Label htmlFor="reminder-message">Pesan pengingat</Label>
        <Textarea id="reminder-message" name="message" required maxLength={300} defaultValue="Jangan lupa menyelesaikan tugas ini sebelum deadline, ya." />
        <Button disabled={busy} type="submit">{busy ? "Mengirim..." : "Kirim pengingat"}</Button>
      </form>
    </DialogContent>
  </Dialog>
}
