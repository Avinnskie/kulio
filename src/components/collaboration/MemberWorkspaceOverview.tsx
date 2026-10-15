import { BookOpenText, CalendarBlank } from "@phosphor-icons/react"
import { useCollaboration } from "@/collaboration/Provider"
import type { MemberTask } from "@/collaboration/domain"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { assertNever, priorityLabel, statusLabel, type Course } from "@/domain"
import { formatDateTime, relativeDeadline } from "@/lib/date"
import { cn } from "@/lib/utils"

function statusTone(status: MemberTask["status"]): string {
  switch (status) {
    case "selesai": return "bg-success-soft text-success"
    case "dikerjakan": return "bg-warning-soft text-warning"
    case "belum_selesai": return "bg-danger-soft text-destructive"
    default: return assertNever(status)
  }
}

function priorityTone(priority: MemberTask["priority"]): string {
  switch (priority) {
    case "tinggi": return "text-destructive"
    case "sedang": return "text-warning"
    case "rendah": return "text-muted-foreground"
    default: return assertNever(priority)
  }
}

function includesQuery(value: string, query: string): boolean {
  return value.toLocaleLowerCase("id-ID").includes(query)
}

function courseForTask(courses: readonly Course[], task: MemberTask): Course | null {
  return courses.find((course) => course.id === task.courseId) ?? null
}

export function MemberWorkspaceOverview({ search }: { readonly search: string }) {
  const { detail, viewer } = useCollaboration()
  if (!detail) return null

  const query = search.trim().toLocaleLowerCase("id-ID")
  const visibleMembers = detail.members.flatMap((member) => {
    const workspace = detail.memberWorkspaces.find((item) => item.memberId === member.id)
    if (!workspace) return []

    const memberMatches = includesQuery(member.displayName, query)
    const visibleTasks = query === "" || memberMatches
      ? workspace.tasks
      : workspace.tasks.filter((task) => {
          const course = courseForTask(workspace.courses, task)
          return includesQuery(`${task.title} ${course?.name ?? ""} ${course?.shortName ?? ""}`, query)
        })
    const visibleTaskCourseIds = new Set(visibleTasks.map((task) => task.courseId))
    const visibleCourses = query === "" || memberMatches
      ? workspace.courses
      : workspace.courses.filter((course) => includesQuery(`${course.name} ${course.shortName}`, query) || visibleTaskCourseIds.has(course.id))

    if (query !== "" && visibleCourses.length === 0 && visibleTasks.length === 0) return []
    const completedTasks = workspace.tasks.filter((task) => task.status === "selesai").length
    const completion = workspace.tasks.length ? Math.round(completedTasks / workspace.tasks.length * 100) : 0
    return [{ member, workspace, visibleCourses, visibleTasks, completedTasks, completion }]
  })

  return <section className="mb-6" aria-labelledby="member-workspaces-title">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-[-0.02em]" id="member-workspaces-title">Aktivitas anggota</h2>
        <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">Lihat mata kuliah, tugas pribadi, dan deadline seluruh anggota. Catatan tugas tetap privat.</p>
      </div>
      <Badge variant="secondary" className="shrink-0 self-start rounded-md px-3 py-1.5 sm:self-auto">{detail.members.length} anggota</Badge>
    </div>

    {visibleMembers.length === 0 ? <Card className="items-center border-border px-6 py-10 text-center shadow-none">
      <BookOpenText className="size-9 text-muted-foreground" />
      <div><h3 className="font-bold">Tidak ada data yang cocok</h3><p className="mt-1 text-sm text-muted-foreground">Coba kata pencarian lain untuk anggota, mata kuliah, atau tugas.</p></div>
    </Card> : <div className="grid gap-4">
      {visibleMembers.map(({ member, workspace, visibleCourses, visibleTasks, completedTasks, completion }) => <Card className="gap-0 overflow-hidden border-border py-0 shadow-none" key={member.id} aria-labelledby={`member-${member.id}`}>
        <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 shrink-0"><AvatarFallback>{member.displayName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold" id={`member-${member.id}`}>{member.displayName}{member.id === viewer?.id ? " (Anda)" : ""}</h3>{member.role === "owner" ? <Badge variant="outline" className="rounded-md">Pemilik</Badge> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">{workspace.courses.length} mata kuliah · {workspace.tasks.length} tugas pribadi</p>
            </div>
          </div>
          {workspace.tasks.length ? <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{completedTasks} dari {workspace.tasks.length} tugas selesai</span><strong className="tabular-nums">{completion}%</strong></div>
            <Progress value={completion} aria-label={`Penyelesaian tugas pribadi ${member.displayName}`} />
          </div> : <p className="text-sm text-muted-foreground sm:text-right">Belum ada progres tugas.</p>}
        </div>

        <div className="grid border-t border-divider md:grid-cols-[minmax(13rem,15rem)_minmax(0,1fr)]">
          <section className="bg-secondary/35 p-5 md:border-r md:border-divider" aria-labelledby={`courses-${member.id}`}>
            <div className="mb-3 flex items-center justify-between gap-3"><h4 className="flex items-center gap-2 text-sm font-bold" id={`courses-${member.id}`}><BookOpenText className="size-4 text-muted-foreground" />Mata kuliah</h4><span className="text-xs tabular-nums text-muted-foreground">{visibleCourses.length}</span></div>
            {visibleCourses.length ? <ul className="grid divide-y divide-divider">
              {visibleCourses.map((course) => <li className="flex min-w-0 items-start gap-2 py-2 first:pt-0 last:pb-0" key={course.id}><CourseColorDot color={course.color} className="mt-1 size-2.5" /><span className="min-w-0 flex-1 break-words text-sm">{course.name}</span><span className="shrink-0 text-xs text-muted-foreground">{course.shortName}</span></li>)}
            </ul> : <p className="text-sm text-muted-foreground">{query ? "Tidak ada mata kuliah yang cocok." : "Belum ada mata kuliah."}</p>}
          </section>

          <section className="min-w-0 border-t border-divider md:border-t-0" aria-labelledby={`tasks-${member.id}`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4"><h4 className="flex items-center gap-2 text-sm font-bold" id={`tasks-${member.id}`}><CalendarBlank className="size-4 text-muted-foreground" />Tugas dan deadline</h4><span className="text-xs tabular-nums text-muted-foreground">{visibleTasks.length}</span></div>
            {visibleTasks.length ? <ul className="border-t border-divider divide-y divide-divider">
              {visibleTasks.map((task) => {
                const course = courseForTask(workspace.courses, task)
                return <li className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.7fr)_minmax(10rem,0.8fr)] md:items-center" key={task.id}>
                  <div className="min-w-0"><strong className="block break-words text-sm">{task.title}</strong><span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">{course ? <CourseColorDot color={course.color} /> : null}<span className="break-words">{course?.name ?? "Mata kuliah tidak tersedia"}</span></span></div>
                  <div className="min-w-0"><span className="block text-xs font-medium text-muted-foreground">Deadline</span><span className="mt-1 block break-words text-sm tabular-nums">{formatDateTime(task.dueAt)}</span><span className="text-xs text-muted-foreground">{relativeDeadline(task.dueAt)}</span></div>
                  <div className="grid gap-2"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary" className={cn("rounded-md", statusTone(task.status))}>{statusLabel(task.status)}</Badge><span className="text-xs text-muted-foreground">Prioritas <strong className={priorityTone(task.priority)}>{priorityLabel(task.priority)}</strong></span></div><div className="flex items-center gap-2"><Progress value={task.progress} aria-label={`Progres ${task.title}`} /><span className="text-xs tabular-nums text-muted-foreground">{task.progress}%</span></div></div>
                </li>
              })}
            </ul> : <div className="flex items-start gap-3 border-t border-divider px-5 py-7"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground"><CalendarBlank className="size-4" /></span><div><h5 className="text-sm font-bold">{query ? "Tidak ada tugas yang cocok" : "Belum ada tugas pribadi"}</h5><p className="mt-1 text-sm text-muted-foreground">{query ? "Coba kata pencarian lain." : member.id === viewer?.id ? "Tambahkan tugas dari menu Semua tugas." : "Tugas akan muncul setelah anggota ini menambahkannya."}</p></div></div>}
          </section>
        </div>
      </Card>)}
    </div>}
  </section>
}
