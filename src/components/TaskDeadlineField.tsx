import { CalendarBlank, Clock } from "@phosphor-icons/react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toDateInputValue } from "../lib/date"

type TaskDeadlineFieldProps = {
  readonly id: string
  readonly deadline: Date
  readonly disabled: boolean
  readonly label: string
  readonly name?: string
  readonly onChange: (deadline: Date) => void
}

export function TaskDeadlineField({ id, deadline, disabled, label, name, onChange }: TaskDeadlineFieldProps) {
  const timeId = `${id}-time`
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      {name === undefined ? null : <input name={name} type="hidden" value={toDateInputValue(deadline)} />}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="min-h-11 w-full justify-start gap-3 bg-card px-3 text-left font-medium capitalize"
          >
            <CalendarBlank className="size-5 text-primary" aria-hidden="true" />
            <span className="min-w-0 truncate">
              {format(deadline, "EEEE, d MMMM yyyy · HH:mm", { locale: idLocale })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0">
          <Calendar
            mode="single"
            selected={deadline}
            locale={idLocale}
            disabled={disabled}
            onSelect={(selectedDate) => {
              if (!selectedDate) return
              const nextDeadline = new Date(selectedDate)
              nextDeadline.setHours(deadline.getHours(), deadline.getMinutes(), 0, 0)
              onChange(nextDeadline)
            }}
          />
          <div className="grid gap-2 border-t border-divider p-3">
            <Label htmlFor={timeId} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              Waktu deadline
            </Label>
            <Input
              id={timeId}
              type="time"
              step={60}
              disabled={disabled}
              className="min-h-11"
              value={`${String(deadline.getHours()).padStart(2, "0")}:${String(deadline.getMinutes()).padStart(2, "0")}`}
              onChange={(event) => {
                const [hourText, minuteText] = event.currentTarget.value.split(":")
                if (hourText === undefined || minuteText === undefined) return
                const hours = Number.parseInt(hourText, 10)
                const minutes = Number.parseInt(minuteText, 10)
                if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return
                const nextDeadline = new Date(deadline)
                nextDeadline.setHours(hours, minutes, 0, 0)
                onChange(nextDeadline)
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
