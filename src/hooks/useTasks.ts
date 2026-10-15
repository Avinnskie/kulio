import { toast } from "sonner"
import { useCallback } from "react"
import type { Course, CourseDraft, Task, TaskForm, TaskId, TaskStatus } from "@/domain"
import { CourseIdSchema, nextStatus, progressForStatus, statusLabel, TaskIdSchema } from "@/domain"
import { useCloudTasks } from "./useCloudTasks"

export function useTasks(accountId: string) {
  const cloud = useCloudTasks(accountId)
  const changeStatus = (taskId: TaskId, status: TaskStatus) => {
    void cloud.mutate((snapshot) => {
      const task = snapshot.tasks.find((item) => item.id === taskId)
      const version = snapshot.versions[taskId]
      if (!task || version === undefined) return null
      return { type: "save", task: { ...task, status, progress: progressForStatus(status, task.progress) }, expectedVersion: version }
    }, `Status diubah: ${statusLabel(status)}`)
  }

  const advanceTask = (taskId: TaskId) => {
    void cloud.mutate((snapshot) => {
      const task = snapshot.tasks.find((item) => item.id === taskId)
      const version = snapshot.versions[taskId]
      if (!task || version === undefined) return null
      const status = nextStatus(task.status)
      return { type: "save", task: { ...task, status, progress: progressForStatus(status, task.progress) }, expectedVersion: version }
    }, "Status tugas tersimpan")
  }

  const updateProgress = useCallback((taskId: TaskId, progress: number) => {
    return cloud.mutate((snapshot) => {
      const task = snapshot.tasks.find((item) => item.id === taskId)
      const version = snapshot.versions[taskId]
      if (!task || version === undefined) return null
      return { type: "save", task: { ...task, progress, status: progress === 100 ? "selesai" : "dikerjakan" }, expectedVersion: version }
    })
  }, [cloud.mutate])

  const saveTask = (form: TaskForm, existing: Task | null) => {
    const dueAt = new Date(form.dueAt).toISOString()
    const id = existing?.id ?? TaskIdSchema.parse(crypto.randomUUID())
    return cloud.mutate((snapshot) => {
      const latest = existing ? snapshot.tasks.find((task) => task.id === id) : null
      const version = snapshot.versions[id]
      if (existing && (!latest || version === undefined)) return null
      const task: Task = latest ? { ...latest, ...form, dueAt } : {
        ...form, id, dueAt, status: "belum_selesai", progress: 0, createdAt: new Date().toISOString(),
      }
      return { type: "save", task, expectedVersion: existing ? version ?? null : null }
    }, existing ? "Perubahan tugas tersimpan" : "Tugas baru tersimpan")
  }

  const saveTasks = (forms: readonly TaskForm[]) => {
    const createdAt = new Date().toISOString()
    const tasks: readonly Task[] = forms.map((form) => ({
      ...form,
      id: TaskIdSchema.parse(crypto.randomUUID()),
      dueAt: new Date(form.dueAt).toISOString(),
      status: "belum_selesai",
      progress: 0,
      createdAt,
    }))
    return cloud.mutate(
      () => ({ type: "save_many", tasks: [...tasks] }),
      `${tasks.length} tugas baru tersimpan`,
    )
  }

  const deleteTask = (task: Task) => {
    void cloud.mutate((snapshot) => {
      const version = snapshot.versions[task.id]
      return version === undefined ? null : { type: "delete", taskId: task.id, expectedVersion: version }
    }).then((saved) => {
      if (saved) toast("Tugas dihapus", {
        action: { label: "Urungkan", onClick: () => { void cloud.mutate(() => ({ type: "save", task, expectedVersion: null }), "Tugas dipulihkan") } },
      })
    })
  }

  const saveCourse = (form: CourseDraft, existing: Course | null) => {
    const course: Course = {
      ...form,
      id: existing?.id ?? CourseIdSchema.parse(crypto.randomUUID()),
    }
    return cloud.mutate(() => ({ type: "save_course", course }), existing ? "Mata kuliah diperbarui" : "Mata kuliah ditambahkan")
  }

  const deleteCourse = (course: Course) => cloud.mutate(
    () => ({ type: "delete_course", courseId: course.id }),
    "Mata kuliah dihapus",
  )

  return { ...cloud, saveTask, saveTasks, changeStatus, advanceTask, updateProgress, deleteTask, saveCourse, deleteCourse }
}
