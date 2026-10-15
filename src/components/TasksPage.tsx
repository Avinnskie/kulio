import { CheckCircle, ListPlus, Plus } from "@phosphor-icons/react"
import type { Task, TaskId } from "../domain"
import { Button } from "./Button"
import { TaskTable } from "./TaskTable"

type TasksPageProps = {
  readonly archived: boolean
  readonly tasks: readonly Task[]
  readonly onAdd: () => void
  readonly onBulkAdd: () => void
  readonly onAdvance: (taskId: TaskId) => void
  readonly onProgress: (taskId: TaskId, progress: number) => Promise<boolean>
}

export function TasksPage({ archived, tasks, onAdd, onBulkAdd, onAdvance, onProgress }: TasksPageProps) {
  return (
    <>
      <section className="mx-auto flex max-w-[93.75rem] flex-col items-stretch justify-between gap-6 py-4 pb-6 md:flex-row md:items-end md:py-5 md:pb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-primary">{archived ? "Riwayat semester" : "Database tugas"}</span>
          <h1 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em]">{archived ? "Arsip selesai" : "Semua tugas"}</h1>
          <p className="mt-2 text-base text-muted-foreground md:text-[1.0625rem]">
            {archived
              ? "Tugas yang sudah dikumpulkan tetap tersimpan untuk ditinjau kembali."
              : "Cari, filter, dan perbarui progres dari satu tempat."}
          </p>
        </div>
        {archived ? (
          <span className="flex items-center gap-2 self-start rounded-full bg-success-soft px-3 py-2 font-bold text-success md:self-auto">
            <CheckCircle weight="fill" />
            {tasks.length} selesai
          </span>
        ) : (
          <div className="grid w-full gap-2 sm:grid-cols-2 md:flex md:w-auto">
            <Button className="w-full md:w-auto" icon={<ListPlus weight="bold" />} onClick={onBulkAdd} variant="secondary">
              Tambah banyak
            </Button>
            <Button className="w-full md:w-auto" icon={<Plus weight="bold" />} onClick={onAdd} variant="primary">
              Tambah tugas
            </Button>
          </div>
        )}
      </section>
      <section
        className="mx-auto min-w-0 max-w-[93.75rem] overflow-hidden rounded-lg border border-border bg-card"
        aria-label={archived ? "Daftar tugas selesai" : "Daftar semua tugas"}
      >
        <TaskTable tasks={tasks} onAdvance={onAdvance} onProgress={onProgress} />
      </section>
    </>
  )
}
