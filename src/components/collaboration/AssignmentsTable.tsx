import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BellRinging, PencilSimple, Trash } from "@phosphor-icons/react"
import { useCollaboration } from "@/collaboration/Provider"
import type { AssignmentRow, SharedTask } from "@/collaboration/domain"
import { DataTable } from "@/components/data-table/DataTable"
import { CourseColorDot } from "@/components/CourseColorDot"
import { SortHeader } from "@/components/data-table/SortHeader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TASK_STATUSES, TaskStatusSchema, statusLabel } from "@/domain"
import { formatDateTime, relativeDeadline } from "@/lib/date"

type AssignmentsTableProps = {
  readonly memberFilter: string
  readonly search: string
  readonly onEdit: (task: SharedTask) => void
  readonly onDelete: (task: SharedTask) => void
  readonly onRemind: (row: AssignmentRow) => void
}
const labels = { complete: "Selesai", title: "Tugas", member: "Anggota", deadline: "Deadline", status: "Status", updated: "Pembaruan" }

export function AssignmentsTable({ memberFilter, search, onEdit, onDelete, onRemind }: AssignmentsTableProps) {
  const { detail, viewer, busy, mutate } = useCollaboration()
  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID")
    return detail?.tasks.flatMap((task) => task.assignments.flatMap((assignment) => {
      const member = detail.members.find((person) => person.id === assignment.memberId)
      if (!member || (memberFilter !== "semua" && member.id !== memberFilter)) return []
      if (query && !`${task.title} ${member.displayName} ${task.course.name}`.toLocaleLowerCase("id-ID").includes(query)) return []
      return [{ task, member, assignment }]
    })) ?? []
  }, [detail, memberFilter, search])
  const columns = useMemo<ColumnDef<AssignmentRow>[]>(() => [
    { id: "complete", enableHiding: false, header: "Selesai", cell: ({ row }) => <div className="grid size-11 place-items-center"><Checkbox className="size-5 border-border" disabled={busy} checked={row.original.assignment.status === "selesai"}
      aria-label={`Selesai: ${row.original.task.title}, ${row.original.member.displayName}`}
      onCheckedChange={(checked) => { if (detail) void mutate({ type: "update_assignment", groupId: detail.group.id, taskId: row.original.task.id, memberId: row.original.member.id, expectedVersion: row.original.assignment.version, status: checked === true ? "selesai" : "belum_selesai" }, checked === true ? "Anggota ditandai selesai" : "Tugas dibuka kembali") }} /></div> },
    { id: "title", accessorFn: (row) => row.task.title, enableHiding: false, header: ({ column }) => <SortHeader column={column} label="Tugas" />,
      cell: ({ row }) => <div className="grid min-w-40 max-w-[22rem] gap-1 break-words"><strong>{row.original.task.title}</strong><Badge variant="secondary" className="w-fit gap-1.5 whitespace-normal"><CourseColorDot color={row.original.task.course.color} className="size-2" />{row.original.task.course.name}</Badge><small className="text-xs text-muted-foreground">{row.original.task.notes}</small></div> },
    { id: "member", accessorFn: (row) => row.member.displayName, header: ({ column }) => <SortHeader column={column} label="Anggota" />, cell: ({ row }) => <span>{row.original.member.displayName}{row.original.member.id === viewer?.id ? " (Anda)" : ""}</span> },
    { id: "deadline", accessorFn: (row) => row.task.dueAt, header: ({ column }) => <SortHeader column={column} label="Deadline" />, cell: ({ row }) => <div className="grid min-w-40 max-w-[22rem] gap-1 break-words"><span>{formatDateTime(row.original.task.dueAt)}</span><small className="text-xs text-muted-foreground">{relativeDeadline(row.original.task.dueAt)}</small></div> },
    { id: "status", accessorFn: (row) => statusLabel(row.assignment.status), header: ({ column }) => <SortHeader column={column} label="Status" />,
      cell: ({ row }) => <Select disabled={busy} value={row.original.assignment.status} onValueChange={(value) => {
        const parsed = TaskStatusSchema.safeParse(value)
        if (parsed.success && detail) void mutate({ type: "update_assignment", groupId: detail.group.id, taskId: row.original.task.id, memberId: row.original.member.id, expectedVersion: row.original.assignment.version, status: parsed.data }, "Status anggota diperbarui")
      }}><SelectTrigger aria-label={`Status ${row.original.member.displayName}: ${row.original.task.title}`} className={`min-h-11 min-w-38 border-transparent text-xs font-bold ${row.original.assignment.status === "selesai" ? "bg-success-soft text-success" : row.original.assignment.status === "dikerjakan" ? "bg-warning-soft text-warning" : "bg-danger-soft text-destructive"}`}><SelectValue /></SelectTrigger><SelectContent>{TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}</SelectContent></Select> },
    { id: "updated", header: "Terakhir diperbarui", cell: ({ row }) => <div className="grid min-w-40 max-w-[22rem] gap-1 break-words"><span>{detail?.members.find((member) => member.id === row.original.assignment.updatedBy)?.displayName ?? "Anggota"}</span><small className="text-xs text-muted-foreground">{formatDateTime(row.original.assignment.updatedAt)}</small></div> },
    { id: "actions", enableHiding: false, header: "Aksi", cell: ({ row }) => {
      const editable = row.original.task.createdBy === viewer?.id || detail?.group.role === "owner"
      return <div className="flex min-w-36 flex-nowrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy || row.original.member.id === viewer?.id || row.original.assignment.status === "selesai"} onClick={() => onRemind(row.original)}><BellRinging />Ingatkan</Button>
        {editable ? <><Button variant="ghost" size="icon" aria-label={`Edit ${row.original.task.title}`} disabled={busy} onClick={() => onEdit(row.original.task)}><PencilSimple /></Button><Button variant="ghost" size="icon" aria-label={`Hapus ${row.original.task.title}`} disabled={busy} onClick={() => onDelete(row.original.task)}><Trash /></Button></> : null}
      </div>
    } },
  ], [detail, viewer, busy, mutate, onEdit, onDelete, onRemind])
  return <DataTable columns={columns} data={rows} labels={labels} initialSorting={[{ id: "deadline", desc: false }]} emptyMessage="Belum ada penugasan. Tambahkan tugas untuk anggota ruang ini." />
}
