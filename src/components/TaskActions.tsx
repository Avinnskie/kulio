import { DotsThree, Eye, PencilSimple, Trash } from "@phosphor-icons/react"
import { createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, TaskId, TaskStatus } from "@/domain"
import { TASK_STATUSES, TaskStatusSchema, statusLabel } from "@/domain"

type TaskActions = {
  readonly onView: (taskId: TaskId) => void
  readonly onViewDay: (day: Date, taskIds: readonly TaskId[]) => void
  readonly onEdit: (task: Task) => void
  readonly onDelete: (task: Task) => void
  readonly onStatusChange: (id: TaskId, status: TaskStatus) => void
}

export const TaskActionsContext = createContext<TaskActions | null>(null)

export function useTaskActions() {
  const actions = useContext(TaskActionsContext)
  if (actions === null) throw new Error("Task actions require a workspace provider")
  return actions
}

export function TaskMenu({ task }: { readonly task: Task }) {
  const actions = useTaskActions()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Opsi untuk ${task.title}`} className="size-9 shrink-0 text-muted-foreground [&_svg]:size-5" variant="ghost" size="icon" type="button">
          <DotsThree weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => actions.onView(task.id)}><Eye />Lihat detail</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onEdit(task)}><PencilSimple />Edit tugas</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status tugas</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={task.status} onValueChange={(value) => {
          const parsed = TaskStatusSchema.safeParse(value)
          if (parsed.success) actions.onStatusChange(task.id, parsed.data)
        }}>
          {TASK_STATUSES.map((status) => <DropdownMenuRadioItem value={status} key={status}>{statusLabel(status)}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => actions.onDelete(task)}><Trash />Hapus tugas</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TaskStatusSelect({ task }: { readonly task: Task }) {
  const actions = useTaskActions()
  const tone = task.status === "selesai" ? "bg-success-soft text-success" : task.status === "dikerjakan" ? "bg-warning-soft text-warning" : "bg-danger-soft text-destructive"
  return (
    <Select value={task.status} onValueChange={(value) => {
      const parsed = TaskStatusSchema.safeParse(value)
      if (parsed.success) actions.onStatusChange(task.id, parsed.data)
    }}>
      <SelectTrigger aria-label={`Status ${task.title}`} className={`min-h-11 min-w-38 border-transparent text-xs font-bold ${tone}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
