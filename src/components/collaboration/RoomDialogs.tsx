import { useState } from "react"
import { useCollaboration } from "@/collaboration/Provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RoomDialogs({ mode, onClose }: { readonly mode: "create" | "join" | null; readonly onClose: () => void }) {
  const { busy, mutate } = useCollaboration()
  const [code, setCode] = useState(() => new URL(window.location.href).searchParams.get("invite") ?? "")
  return <Dialog open={mode !== null} onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{mode === "create" ? "Buat ruang belajar" : "Gabung dengan kode"}</DialogTitle>
        <DialogDescription>{mode === "create" ? "Anggota ruang dapat saling melihat mata kuliah, tugas, deadline, dan progres. Catatan tugas tetap privat." : "Masukkan kode dari pemilik ruang. Setelah bergabung, anggota dapat saling melihat mata kuliah dan ringkasan tugas pribadi."}</DialogDescription></DialogHeader>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault()
        const title = new FormData(event.currentTarget).get("title")
        const command = mode === "create" && typeof title === "string" ? { type: "create_group" as const, title } : { type: "join_group" as const, code }
        void mutate(command, mode === "create" ? "Ruang berhasil dibuat" : "Anda bergabung ke ruang").then((success) => { if (success) onClose() })
      }}>
        {mode === "create" ? <><Label htmlFor="room-title">Nama ruang</Label><Input key="room-title" id="room-title" name="title" placeholder="Tugas Semester 1" minLength={2} maxLength={80} required /></>
          : <><Label htmlFor="room-code">Kode undangan</Label><Input key="room-code" id="room-code" value={code} onChange={(event) => setCode(event.currentTarget.value)} placeholder="XXXX-XXXX-XXXX-XXXX" required maxLength={24} autoComplete="off" /></>}
        <Button type="submit" disabled={busy}>{busy ? "Memproses..." : mode === "create" ? "Buat ruang" : "Gabung ruang"}</Button>
      </form>
    </DialogContent>
  </Dialog>
}
