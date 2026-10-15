const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})
const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
})
const weekdayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" })

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate))
}

export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(isoDate))
}

export function formatWeekday(isoDate: string): string {
  return weekdayFormatter.format(new Date(isoDate))
}

export function daysUntil(isoDate: string): number {
  const deadline = new Date(isoDate)
  const today = new Date()
  const deadlineDay = Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((deadlineDay - todayDay) / 86_400_000)
}

export function relativeDeadline(isoDate: string): string {
  const days = daysUntil(isoDate)
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`
  if (new Date(isoDate).getTime() < Date.now()) return "Lewat tenggat"
  if (days === 0) return "Hari ini"
  if (days === 1) return "Besok"
  return `${days} hari lagi`
}

export function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}
