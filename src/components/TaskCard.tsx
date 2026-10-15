import { ArrowRight, CalendarBlank, Check, Circle, Clock } from "@phosphor-icons/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button as ShadcnButton } from "@/components/ui/button"
import { CourseColorDot } from "@/components/CourseColorDot"
import { useCourses } from "@/courses/Provider"
import type { Task, TaskId } from "../domain"
import { nextStatus, priorityLabel, statusLabel } from "../domain"
import { formatDateTime, relativeDeadline } from "../lib/date"
import { TaskMenu, useTaskActions } from "./TaskActions"

type TaskCardProps = {
  readonly task: Task
  readonly onAdvance: (taskId: TaskId) => void
}

export function TaskCard({ task, onAdvance }: TaskCardProps) {
  const { onView } = useTaskActions()
  const { courseById } = useCourses()
  const course = courseById(task.courseId)
  const deadlineState = relativeDeadline(task.dueAt)
  const targetStatus = statusLabel(nextStatus(task.status))
  const priorityTone = task.priority === "tinggi" ? "bg-danger-soft text-destructive" : task.priority === "sedang" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"
  const urgent = deadlineState === "Hari ini" || deadlineState === "Besok" || deadlineState === "Lewat tenggat" || deadlineState.startsWith("Terlambat")

  return (
    <Card className={`gap-0 rounded-md border-border p-3 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-subtle motion-reduce:transform-none ${task.status === "selesai" ? "bg-success-soft shadow-none" : "bg-card"}`} data-complete={task.status === "selesai"}>
      <div className="flex items-start gap-2">
        <ShadcnButton variant="ghost" size="icon"
          aria-label={`Ubah ${task.title} menjadi ${targetStatus}`}
          className={`size-9 shrink-0 rounded-sm ${task.status === "selesai" ? "bg-success text-white hover:bg-success/90" : task.status === "dikerjakan" ? "bg-warning-soft text-warning hover:bg-warning-soft/80" : "bg-muted text-subtle hover:text-foreground"}`}
          data-status={task.status}
          onClick={() => onAdvance(task.id)}
          title={`Pindahkan ke ${targetStatus}`}
          type="button"
        >
          {task.status === "selesai" ? (
            <Check weight="bold" />
          ) : task.status === "dikerjakan" ? (
            <Clock weight="fill" />
          ) : (
            <Circle />
          )}
        </ShadcnButton>
        <div className="grid min-w-0 flex-1 gap-2">
          <h3 className={task.status === "selesai" ? "text-muted-foreground line-through decoration-[0.08em]" : ""}><ShadcnButton variant="link" className="h-auto min-h-8 justify-start p-0 text-left text-foreground whitespace-normal" aria-label={`Lihat detail ${task.title}`} onClick={() => onView(task.id)}>{task.title}</ShadcnButton></h3>
          <Badge variant="secondary" className="w-fit max-w-full gap-1.5 truncate rounded-full px-2 py-[0.1875rem] text-[0.6875rem] font-bold leading-tight"><CourseColorDot color={course.color} className="size-2" />{course.name}</Badge>
        </div>
        <TaskMenu task={task} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarBlank className="size-3.5" aria-hidden="true" />
          {formatDateTime(task.dueAt)}
        </span>
        {task.status === "selesai" ? (
          <span className="inline-flex items-center gap-1 font-bold text-success">
            <Check aria-hidden="true" />
            Sudah dikumpulkan
          </span>
        ) : (
          <Badge variant="secondary" className={`w-fit rounded-full px-2 py-[0.1875rem] text-[0.6875rem] font-bold leading-tight ${priorityTone}`}>
            {priorityLabel(task.priority)}
          </Badge>
        )}
      </div>
      {task.status === "dikerjakan" ? (
        <div className="mt-3 flex items-center gap-2">
          <Progress className="h-1.5 bg-muted [&_[data-slot=progress-indicator]]:bg-primary" value={task.progress} aria-label={`Progres ${task.title}`} />
          <strong className="text-[0.6875rem] text-muted-foreground tabular-nums">{task.progress}%</strong>
        </div>
      ) : null}
      {task.status === "belum_selesai" ? (
        <div
          className={`mt-3 flex items-center justify-between border-t border-divider pt-2 text-[0.6875rem] font-bold ${urgent ? "text-destructive" : "text-muted-foreground"}`}
          data-urgent={urgent}
        >
          <span>{deadlineState}</span>
          <ArrowRight aria-hidden="true" />
        </div>
      ) : null}
    </Card>
  )
}
