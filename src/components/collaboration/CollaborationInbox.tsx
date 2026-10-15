import { BellRinging, Check } from "@phosphor-icons/react"
import { useCollaboration } from "@/collaboration/Provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/date"

export function CollaborationInbox({ onOpenRoom }: { readonly onOpenRoom: (groupId: string) => void }) {
  const { inbox, viewer, busy, mutate, error } = useCollaboration()
  return <section className="border-t border-divider px-4 py-5 sm:px-6" aria-label="Pengingat dari teman">
    <h3 className="mb-3 flex items-center gap-2 [&_svg]:text-primary"><BellRinging />Pengingat dari teman</h3>
    {error ? <p className="text-xs text-muted-foreground" role="status">Kotak masuk belum terhubung. Buka Kolaborasi untuk mencoba kembali.</p>
      : !viewer ? <p className="text-xs text-muted-foreground">Menghubungkan akun ke kotak masuk...</p>
      : inbox.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada pengingat dari teman.</p> : inbox.map((item) => <article className="mb-3 grid gap-2 break-words rounded-md bg-muted p-4 data-[unread=true]:bg-accent" key={item.id} data-unread={item.readAt === null}>
        <div className="flex items-center justify-between gap-2"><strong>{item.taskTitle}</strong>{item.readAt === null ? <Badge>Baru</Badge> : <Badge variant="secondary">Dibaca</Badge>}</div>
        <small className="text-xs text-muted-foreground">{item.fromName} · {item.groupTitle} · {formatDateTime(item.createdAt)}</small><p className="text-[0.8125rem]">{item.message}</p>
        <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => onOpenRoom(item.groupId)}>Lihat ruang</Button>
          {item.readAt === null ? <Button variant="ghost" size="sm" disabled={busy} onClick={() => void mutate({ type: "read_reminder", reminderId: item.id }, "")}><Check />Tandai dibaca</Button> : null}</div>
      </article>)}
  </section>
}
