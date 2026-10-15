import { BellRinging, CheckCircle, WarningCircle, X } from "@phosphor-icons/react"
import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { CourseColorDot } from "@/components/CourseColorDot"
import { useCourses } from "@/courses/Provider"
import type { Task } from "../domain"
import { formatDateTime, relativeDeadline } from "../lib/date"
import {
  type NotificationCapability,
  notificationCapability,
  requestNotificationPermission,
} from "../lib/notifications"
import { Button, IconButton } from "./Button"
import { CollaborationInbox } from "./collaboration/CollaborationInbox"

type NotificationDialogProps = {
  readonly open: boolean
  readonly tasks: readonly Task[]
  readonly onClose: () => void
  readonly onOpenRoom: (groupId: string) => void
}

export function NotificationDialog({ open, tasks, onClose, onOpenRoom }: NotificationDialogProps) {
  const { courseById } = useCourses()
  const [capability, setCapability] = useState<NotificationCapability>(() =>
    notificationCapability(),
  )

  const urgent = tasks
    .filter(
      (task) =>
        task.status !== "selesai" && new Date(task.dueAt).getTime() - Date.now() <= 3 * 86_400_000,
    )
    .slice()
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))

  return (
    <Sheet open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <SheetContent className="w-full max-w-[34rem] gap-0 overflow-y-auto bg-popover sm:max-w-[34rem]" showCloseButton={false}>
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider p-4 sm:p-6">
          <span className="grid size-11 place-items-center rounded-md bg-accent text-primary [&_svg]:size-6">
            <BellRinging weight="fill" />
          </span>
          <span>
            <span className="text-xs font-bold uppercase tracking-[0.06em] text-primary">Pusat pengingat</span>
            <SheetTitle className="text-[1.375rem] font-bold leading-[1.3] tracking-[-0.02em]">Deadline yang perlu dilihat</SheetTitle>
          </span>
          <IconButton icon={<X />} label="Tutup notifikasi" onClick={onClose} />
        </header>
        <SheetDescription className="sr-only">Tugas yang belum selesai dan jatuh tempo dalam tiga hari.</SheetDescription>
        <div className={`mx-4 mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md p-4 sm:mx-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] ${capability === "denied" ? "bg-danger-soft text-destructive" : capability === "granted" ? "bg-success-soft text-success" : "bg-accent text-primary"}`} data-permission={capability}>
          <span className="[&_svg]:size-6">{capability === "granted" ? <CheckCircle weight="fill" /> : <BellRinging />}</span>
          <div>
            <strong>{permissionTitle(capability)}</strong>
            <p className="mt-1 text-xs text-muted-foreground">{permissionDescription(capability)}</p>
          </div>
          {capability === "default" ? (
            <Button
              onClick={() => {
                void requestNotificationPermission().then(setCapability)
              }}
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
              variant="secondary"
            >
              Aktifkan
            </Button>
          ) : null}
        </div>
        <div className="grid px-4 py-4 sm:px-6">
          {urgent.length === 0 ? (
            <div className="grid min-h-48 place-items-center content-center gap-2 text-center text-muted-foreground">
              <CheckCircle className="size-8 text-success" weight="fill" />
              <h3>Tidak ada deadline mendesak.</h3>
              <p>Semua tugas terdekat sudah aman.</p>
            </div>
          ) : (
            urgent.map((task) => {
              const course = courseById(task.courseId)
              return (
                <article className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-divider py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]" key={task.id}>
                  <CourseColorDot color={course.color} />
                  <span className="grid min-w-0">
                    <strong>{task.title}</strong>
                    <small className="text-xs text-muted-foreground">
                      {course.name} · {formatDateTime(task.dueAt)}
                    </small>
                  </span>
                  <span className="col-start-2 flex items-center gap-1 text-xs font-bold text-destructive sm:col-start-auto">
                    <WarningCircle />
                    {relativeDeadline(task.dueAt)}
                  </span>
                </article>
              )
            })
          )}
        </div>
        <CollaborationInbox onOpenRoom={onOpenRoom} />
        <p className="mx-4 mb-6 rounded-sm bg-muted p-3 text-xs text-muted-foreground sm:mx-6">
          Biarkan Kulio terbuka agar pengingat browser dapat muncul. Tugas yang sudah selesai tidak akan diingatkan lagi.
        </p>
      </SheetContent>
    </Sheet>
  )
}

function permissionTitle(capability: NotificationCapability): string {
  switch (capability) {
    case "granted":
      return "Pengingat browser aktif"
    case "denied":
      return "Izin notifikasi diblokir"
    case "default":
      return "Aktifkan pengingat browser"
    case "unsupported":
      return "Browser belum mendukung notifikasi"
  }
}

function permissionDescription(capability: NotificationCapability): string {
  switch (capability) {
    case "granted":
      return "Kami akan mengingatkan tugas yang jatuh tempo dalam 24 jam."
    case "denied":
      return "Ubah izin dari pengaturan browser jika ingin mengaktifkannya."
    case "default":
      return "Izin hanya diminta setelah Anda menekan tombol ini."
    case "unsupported":
      return "Gunakan pusat pengingat di dalam aplikasi ini."
  }
}
