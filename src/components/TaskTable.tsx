import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { TaskProgressInput } from "./TaskProgressInput"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/DataTable"
import { SortHeader } from "@/components/data-table/SortHeader"
import { CourseColorDot } from "@/components/CourseColorDot"
import { useCourses } from "@/courses/Provider"
import type { Task, TaskId } from "../domain"
import { priorityLabel } from "../domain"
import { formatDateTime, relativeDeadline } from "../lib/date"
import { TaskMenu, TaskStatusSelect, useTaskActions } from "./TaskActions"

type TaskTableProps = {
  readonly tasks: readonly Task[]
  readonly onAdvance: (taskId: TaskId) => void
  readonly onProgress: (taskId: TaskId, progress: number) => Promise<boolean>
}

const labels = { title: "Tugas", course: "Mata kuliah", dueAt: "Deadline", status: "Status", progress: "Progres" }

function priorityTone(priority: Task["priority"]) {
  if (priority === "tinggi") return "bg-danger-soft text-destructive"
  if (priority === "sedang") return "bg-warning-soft text-warning"
  return "bg-muted text-muted-foreground"
}

export function TaskTable({ tasks, onProgress }: TaskTableProps) {
  const { onView } = useTaskActions()
  const { courseById } = useCourses()
  const columns = useMemo<ColumnDef<Task>[]>(() => [
    { accessorKey: "title", enableHiding: false, header: ({ column }) => <SortHeader column={column} label="Tugas" />,
      cell: ({ row }) => <div className="grid min-w-40 max-w-[22rem] gap-1 break-words"><Button variant="link" className="h-auto min-h-8 justify-start p-0 text-left font-semibold text-foreground whitespace-normal" aria-label={`Lihat detail ${row.original.title}`} onClick={() => onView(row.original.id)}>{row.original.title}</Button><small className="text-xs text-muted-foreground">{row.original.notes || "Tidak ada catatan"}</small></div> },
    { id: "course", accessorFn: (task) => courseById(task.courseId).name, header: ({ column }) => <SortHeader column={column} label="Mata kuliah" />,
      cell: ({ row }) => { const course = courseById(row.original.courseId); return <Badge variant="secondary" className="w-fit max-w-full gap-1.5 rounded-full text-[0.6875rem] font-bold"><CourseColorDot color={course.color} className="size-2" />{course.name}</Badge> } },
    { accessorKey: "dueAt", header: ({ column }) => <SortHeader column={column} label="Deadline" />,
      cell: ({ row }) => <div className="grid min-w-40 max-w-[22rem] gap-1 break-words"><span>{formatDateTime(row.original.dueAt)}</span><small className="text-xs text-muted-foreground">{relativeDeadline(row.original.dueAt)}</small></div> },
    { accessorKey: "status", header: ({ column }) => <SortHeader column={column} label="Status" />, cell: ({ row }) => <TaskStatusSelect task={row.original} /> },
    { accessorKey: "progress", header: "Progres / Prioritas", cell: ({ row }) => row.original.status === "dikerjakan"
      ? <TaskProgressInput task={row.original} onProgress={onProgress} />
      : <Badge variant="secondary" className={`w-fit rounded-full text-[0.6875rem] font-bold ${priorityTone(row.original.priority)}`}>{priorityLabel(row.original.priority)}</Badge> },
    { id: "actions", enableHiding: false, header: () => <span className="sr-only">Aksi tugas</span>, cell: ({ row }) => <TaskMenu task={row.original} /> },
  ], [courseById, onProgress, onView])
  return <DataTable columns={columns} data={[...tasks]} labels={labels} initialSorting={[{ id: "dueAt", desc: false }]} />
}
