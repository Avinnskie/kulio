import { ArrowRight, CalendarBlank } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CourseColorDot } from "@/components/CourseColorDot"
import { useCourses } from "@/courses/Provider"
import type { Task } from "../domain"
import { formatShortDate, relativeDeadline } from "../lib/date"
import { useTaskActions } from "./TaskActions"

type UpcomingPanelProps = { readonly tasks: readonly Task[]; readonly onViewAll: () => void }

export function UpcomingPanel({ tasks, onViewAll }: UpcomingPanelProps) {
  const { onView } = useTaskActions()
  const { courseById } = useCourses()
  const upcoming = tasks
    .filter((task) => task.status !== "selesai")
    .slice()
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))
    .slice(0, 5)
  return (
    <Card className="gap-0 overflow-hidden rounded-md border-border bg-card dark:rounded-lg" aria-labelledby="upcoming-title">
      <div className="flex items-center justify-between gap-3 border-b border-divider p-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">Fokus berikutnya</span>
          <h2 className="text-xl font-bold leading-[1.3] tracking-[-0.02em]" id="upcoming-title">Tugas mendatang</h2>
        </div>
        <Button variant="ghost" className="min-h-10 px-2 text-[0.8125rem] font-bold text-primary hover:underline hover:underline-offset-4" onClick={onViewAll} type="button">
          Lihat semua
        </Button>
      </div>
      <div className="grid px-4">
        {upcoming.length === 0 ? <p className="p-4 text-[0.8125rem] text-muted-foreground">Semua tugas sudah selesai. Waktunya mengambil jeda.</p> : null}
        {upcoming.map((task) => {
          const course = courseById(task.courseId)
          return (
            <Button variant="ghost" className="grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center justify-start gap-3 rounded-lg border-b border-divider px-0 py-4 text-left whitespace-normal max-[24rem]:grid-cols-[auto_minmax(0,1fr)_auto]" key={task.id} onClick={() => onView(task.id)} aria-label={`Lihat detail ${task.title}`}>
              <CourseColorDot color={course.color} />
              <span className="grid min-w-0">
                <strong className="truncate">{task.title}</strong>
                <small className="text-[0.6875rem] text-muted-foreground">{course.name}</small>
              </span>
              <span className="grid justify-items-end text-xs text-destructive max-[24rem]:col-start-2 max-[24rem]:justify-items-start">
                <CalendarBlank className="size-3.5" />
                <strong className="flex items-center gap-1">{formatShortDate(task.dueAt)}</strong>
                <small className="text-[0.6875rem] text-muted-foreground">{relativeDeadline(task.dueAt)}</small>
              </span>
              <ArrowRight className="size-3.5 text-subtle max-[24rem]:col-start-3 max-[24rem]:row-span-2 max-[24rem]:row-start-1" aria-hidden="true" />
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
