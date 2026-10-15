import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { useCourses } from "@/courses/Provider"
import { CourseColorDot } from "@/components/CourseColorDot"
import type { Task } from "../domain"
import { IconButton } from "./Button"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTaskActions } from "./TaskActions"

type CalendarGridProps = { readonly tasks: readonly Task[] }
const monthYearFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
})
const fullDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function CalendarGrid({ tasks }: CalendarGridProps) {
  const { onView, onViewDay } = useTaskActions()
  const { courseById } = useCourses()
  const [monthOffset, setMonthOffset] = useState(0)
  const calendar = useMemo(() => {
    const month = new Date()
    month.setDate(1)
    month.setMonth(month.getMonth() + monthOffset)
    const start = new Date(month)
    start.setDate(1 - ((month.getDay() + 6) % 7))
    const days = Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
    return { month, days }
  }, [monthOffset])

  return (
    <Card className="overflow-x-auto gap-0 rounded-md border-border bg-card py-0 dark:rounded-lg" aria-labelledby="month-title">
      <header className="sticky left-0 flex min-w-[43rem] items-center justify-between gap-4 border-b border-divider p-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">Rencana semester</span>
          <h2 className="text-xl font-bold leading-[1.3] tracking-[-0.02em]" id="month-title">{monthYearFormatter.format(calendar.month)}</h2>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<CaretLeft />}
            label="Bulan sebelumnya"
            onClick={() => setMonthOffset((value) => value - 1)}
          />
          <Button variant="ghost" className="min-h-10 px-2 text-[0.8125rem] font-bold text-primary hover:underline hover:underline-offset-4" onClick={() => setMonthOffset(0)} type="button">
            Hari ini
          </Button>
          <IconButton
            icon={<CaretRight />}
            label="Bulan berikutnya"
            onClick={() => setMonthOffset((value) => value + 1)}
          />
        </div>
      </header>
      <div className="grid min-w-[43rem] grid-cols-7 bg-muted px-3">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label) => (
          <span className="p-2 text-right text-[0.6875rem] font-bold uppercase text-subtle" key={label}>{label}</span>
        ))}
      </div>
      <div className="grid min-w-[43rem] grid-cols-7">
        {calendar.days.map((day) => {
          const dayTasks = tasks.filter((task) => dayKey(new Date(task.dueAt)) === dayKey(day))
          const outside = day.getMonth() !== calendar.month.getMonth()
          const today = dayKey(day) === dayKey(new Date())
          return (
            <article
              className={`relative min-h-24 min-w-0 border-b border-r border-divider p-2 md:min-h-[7.5rem] ${outside ? "bg-background text-subtle" : ""}`}
              data-outside={outside}
              data-today={today}
              key={dayKey(day)}
            >
              <Button variant="ghost" className="absolute inset-0 h-full w-full rounded-none p-0 hover:bg-accent/40"
                aria-label={`Lihat agenda ${fullDateFormatter.format(day)}, ${dayTasks.length} tugas`}
                onClick={() => onViewDay(day, dayTasks.map((task) => task.id))}>
                <span className="sr-only">Lihat agenda tanggal {day.getDate()}</span>
              </Button>
              <span className={`pointer-events-none relative ml-auto grid size-7 place-items-center rounded-full text-xs font-bold ${today ? "bg-foreground text-background" : ""}`}>{day.getDate()}</span>
              <div className="pointer-events-none relative mt-1 grid gap-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const course = courseById(task.courseId)
                  return (
                    <Button variant="ghost" className="pointer-events-auto h-auto min-h-8 w-full min-w-0 justify-start gap-1 overflow-hidden rounded-[0.25rem] bg-muted px-1 py-[0.1875rem] text-left text-[0.625rem] font-bold whitespace-nowrap text-foreground hover:bg-muted/80" key={task.id}
                      aria-label={`Lihat detail ${task.title}`} onClick={() => onView(task.id)}>
                      <CourseColorDot color={course.color} className="size-2" /><span className="min-w-0 truncate">{task.title}</span>
                    </Button>
                  )
                })}
                {dayTasks.length > 3 ? <Button variant="ghost" className="pointer-events-auto h-auto min-h-8 justify-start px-1 text-xs text-muted-foreground"
                  aria-label={`Lihat semua ${dayTasks.length} tugas pada ${fullDateFormatter.format(day)}`}
                  onClick={() => onViewDay(day, dayTasks.map((task) => task.id))}>+{dayTasks.length - 3} lainnya</Button> : null}
              </div>
            </article>
          )
        })}
      </div>
    </Card>
  )
}
