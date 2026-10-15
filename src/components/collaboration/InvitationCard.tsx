import { Copy, Key, ArrowsClockwise, Link } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useCollaboration } from "@/collaboration/Provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDateTime } from "@/lib/date"

export function InvitationCard() {
  const { detail, busy, mutate } = useCollaboration()
  if (!detail) return null
  const room = detail.group
  const code = room.inviteCode
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success("Undangan disalin") }
    catch (error: unknown) { if (error instanceof Error) { toast.error("Tidak dapat menyalin. Pilih kode lalu salin secara manual."); return } throw error }
  }
  return <Card className="mb-5 gap-4 p-5">
    <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent text-primary"><Key /></span><span className="grid gap-1"><strong>{code ? "Ajak teman ke ruang ini" : "Anda terhubung ke ruang bersama"}</strong><small className="text-xs text-muted-foreground">{code ? "Bagikan kode atau tautan. Setelah bergabung, kalian saling melihat mata kuliah dan ringkasan tugas pribadi." : "Lihat mata kuliah, tugas, deadline, dan progres seluruh anggota ruang."}</small></span></div>
    {code ? <>
      <code className="w-fit max-w-full select-all rounded-sm bg-muted px-4 py-3 text-[clamp(1rem,2vw,1.375rem)] font-bold tracking-[0.05em] text-foreground">{code.match(/.{1,4}/g)?.join("-")}</code>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => void copy(code)}><Copy />Salin kode</Button>
        <Button variant="outline" onClick={() => { const link = new URL(window.location.origin); link.searchParams.set("invite", code); void copy(link.toString()) }}><Link />Salin tautan</Button>
        <Button variant="ghost" disabled={busy} onClick={() => void mutate({ type: "rotate_invite", groupId: room.id }, "Kode baru dibuat. Kode lama tidak dapat digunakan lagi.")}><ArrowsClockwise />Ganti kode</Button>
      </div>
      <small className="text-xs text-muted-foreground">{room.inviteExpiresAt ? `Berlaku hingga ${formatDateTime(room.inviteExpiresAt)}. Kode baru tidak mengeluarkan anggota yang sudah bergabung.` : ""}</small>
    </> : null}
  </Card>
}
