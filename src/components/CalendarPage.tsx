import type { Task } from "../domain"
import { CalendarGrid } from "./CalendarGrid"
import { UpcomingPanel } from "./UpcomingPanel"

type CalendarPageProps = { readonly tasks: readonly Task[]; readonly onViewAll: () => void }

export function CalendarPage({ tasks, onViewAll }: CalendarPageProps) {
  return (
    <>
      <section className="mx-auto flex max-w-[93.75rem] flex-col gap-6 py-4 pb-6 md:py-5 md:pb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">Waktu dan prioritas</span>
          <h1 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em]">Kalender tugas</h1>
          <p className="mt-2 text-base text-muted-foreground md:text-[1.0625rem]">Lihat kepadatan deadline sebelum minggu Anda terlalu penuh.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-[93.75rem] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <CalendarGrid tasks={tasks} />
        <aside className="min-w-0">
          <UpcomingPanel tasks={tasks} onViewAll={onViewAll} />
        </aside>
      </div>
    </>
  )
}
