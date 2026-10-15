import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Task } from "../domain";
import { formatShortDate, formatWeekday } from "../lib/date";
import { IconButton } from "./Button";
import { Button } from "@/components/ui/button";
import { useTaskActions } from "./TaskActions";
import { statusLabel } from "../domain";

type CalendarPanelProps = { readonly tasks: readonly Task[] };
const monthYearFormatter = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
});
const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

function dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function CalendarPanel({ tasks }: CalendarPanelProps) {
    const { onView, onViewDay } = useTaskActions();
    const [weekOffset, setWeekOffset] = useState(0);
    const days = useMemo(() => {
        const monday = new Date();
        const weekday = monday.getDay();
        monday.setDate(monday.getDate() - ((weekday + 6) % 7) + weekOffset * 7);
        monday.setHours(0, 0, 0, 0);
        return Array.from({ length: 7 }, (_, index) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + index);
            return day;
        });
    }, [weekOffset]);

    return (
        <Card
            className="gap-0 overflow-hidden rounded-md border-border bg-card dark:rounded-lg"
            aria-labelledby="calendar-panel-title"
        >
            <div className="flex items-center justify-between gap-3 border-b border-divider p-5 [&>svg]:size-6 [&>svg]:text-muted-foreground dark:[&>svg]:text-primary">
                <div>
                    <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">
                        Jadwal
                    </span>
                    <h2
                        className="text-xl font-bold leading-[1.3] tracking-[-0.02em]"
                        id="calendar-panel-title"
                    >
                        Kalender minggu ini
                    </h2>
                </div>
                <CalendarBlank aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
                <IconButton
                    icon={<CaretLeft />}
                    label="Minggu sebelumnya"
                    onClick={() => setWeekOffset((value) => value - 1)}
                />
                <strong className="text-[0.8125rem] capitalize">
                    {monthYearFormatter.format(days[3])}
                </strong>
                <IconButton
                    icon={<CaretRight />}
                    label="Minggu berikutnya"
                    onClick={() => setWeekOffset((value) => value + 1)}
                />
            </div>
            <div className="grid grid-cols-7 border-b border-divider px-3 pb-4 pt-2">
                {days.map((day) => {
                    const dayTasks = tasks.filter(
                        (task) =>
                            dateKey(new Date(task.dueAt)) === dateKey(day),
                    );
                    const count = dayTasks.length;
                    const today = dateKey(day) === dateKey(new Date());
                    return (
                        <Button
                            variant="ghost"
                            className="grid h-auto min-h-[4.25rem] min-w-0 place-items-center content-center gap-1 rounded-sm px-0 text-muted-foreground data-[today=true]:bg-foreground data-[today=true]:text-background"
                            data-today={today}
                            key={dateKey(day)}
                            aria-label={`Lihat agenda ${fullDateFormatter.format(day)}, ${count} tugas`}
                            onClick={() =>
                                onViewDay(
                                    day,
                                    dayTasks.map((task) => task.id),
                                )
                            }
                        >
                            <span className="text-[0.625rem] uppercase">
                                {formatWeekday(day.toISOString())}
                            </span>
                            <strong className="text-sm">{day.getDate()}</strong>
                            <span
                                className="flex h-1 gap-0.5"
                                aria-hidden="true"
                            >
                                {count > 0 ? (
                                    <i className="size-1 rounded-full bg-current" />
                                ) : null}
                                {count > 1 ? (
                                    <i className="size-1 rounded-full bg-current" />
                                ) : null}
                                {count > 2 ? (
                                    <i className="size-1 rounded-full bg-current" />
                                ) : null}
                            </span>
                            <span className="sr-only">{count} tugas</span>
                        </Button>
                    );
                })}
            </div>
            <div className="grid p-3">
                {tasks
                    .filter((task) =>
                        days.some(
                            (day) =>
                                dateKey(day) === dateKey(new Date(task.dueAt)),
                        ),
                    )
                    .slice(0, 3)
                    .map((task) => (
                        <Button
                            variant="ghost"
                            className={`grid h-auto w-full grid-cols-[3.25rem_minmax(0,1fr)] justify-start gap-2 rounded-lg border-b border-divider p-3 text-left whitespace-normal ${task.status === "selesai" ? "text-muted-foreground" : "text-foreground"}`}
                            data-status={task.status}
                            key={task.id}
                            aria-label={`Lihat detail ${task.title}`}
                            onClick={() => onView(task.id)}
                        >
                            <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
                                {timeFormatter.format(new Date(task.dueAt))}
                            </span>
                            <span className="grid">
                                <strong>{task.title}</strong>
                                <small className="text-[0.6875rem] text-muted-foreground">
                                    {formatShortDate(task.dueAt)} ·{" "}
                                    {statusLabel(task.status)}
                                </small>
                            </span>
                        </Button>
                    ))}
            </div>
        </Card>
    );
}
