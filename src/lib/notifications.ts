import type { Task } from "../domain"
import { formatDateTime } from "./date"

export type NotificationCapability = "unsupported" | NotificationPermission

export function notificationCapability(): NotificationCapability {
  return "Notification" in window ? Notification.permission : "unsupported"
}

export async function requestNotificationPermission(): Promise<NotificationCapability> {
  if (!("Notification" in window)) return "unsupported"
  return Notification.requestPermission()
}

export function notifyDueTask(task: Task): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return
  const notification = new Notification(`Deadline: ${task.title}`, {
    body: `Jatuh tempo ${formatDateTime(task.dueAt)}.`,
    tag: task.id,
  })
  notification.onclick = () => window.focus()
}
