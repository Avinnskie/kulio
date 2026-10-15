import { CheckCircle, Circle, Clock, Plus } from "@phosphor-icons/react"
import type { Task, TaskId, TaskStatus } from "../domain"
import { statusLabel, TASK_STATUSES } from "../domain"
import { TaskCard } from "./TaskCard"
import { IconButton } from "./Button"

type TaskBoardProps = {
  readonly tasks: readonly Task[]
  readonly onAdvance: (taskId: TaskId) => void
  readonly onAdd: () => void
}

export function TaskBoard({ tasks, onAdvance, onAdd }: TaskBoardProps) {
  return (
    <section className="grid gap-3 rounded-b-md bg-tertiary p-2 dark:rounded-b-lg dark:bg-background lg:grid-cols-1 lg:p-3 2xl:grid-cols-3" aria-label="Tugas per status">
      {TASK_STATUSES.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status)
        return (
          <section className="min-w-0 rounded-sm border border-border bg-secondary dark:rounded-md dark:border-divider dark:bg-card" data-status={status} key={status}>
            <header className="flex min-h-14 items-center justify-between border-b border-divider px-3">
              <span className={`flex items-center gap-2 text-[0.8125rem] [&_svg]:size-3.5 ${status === "selesai" ? "[&_svg]:text-success" : status === "dikerjakan" ? "[&_svg]:text-warning" : "[&_svg]:text-destructive"}`}>
                <StatusIcon status={status} />
                <strong>{statusLabel(status)}</strong>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-muted text-[0.6875rem] font-extrabold text-muted-foreground">{statusTasks.length}</span>
              </span>
              {status === "belum_selesai" ? <IconButton icon={<Plus />} label="Tambah tugas baru" onClick={onAdd} /> : null}
            </header>
            <div className="grid gap-3 p-3 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-1">
              {statusTasks.length === 0 ? (
                <div className="grid min-h-32 place-items-center content-center gap-2 rounded-sm border border-dashed border-border bg-tertiary text-center text-subtle dark:rounded-md dark:bg-transparent md:col-span-2 2xl:col-span-1">
                  <CheckCircle className="size-6" aria-hidden="true" />
                  <span>Tidak ada tugas di sini.</span>
                </div>
              ) : (
                statusTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onAdvance={onAdvance} />
                ))
              )}
            </div>
          </section>
        )
      })}
    </section>
  )
}

function StatusIcon({ status }: { readonly status: TaskStatus }) {
  switch (status) {
    case "belum_selesai":
      return <Circle weight="fill" aria-hidden="true" />
    case "dikerjakan":
      return <Clock weight="fill" aria-hidden="true" />
    case "selesai":
      return <CheckCircle weight="fill" aria-hidden="true" />
  }
}
