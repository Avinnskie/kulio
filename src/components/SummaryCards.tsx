import {
    CheckCircle,
    ClipboardText,
    ClockCountdown,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { Task } from "../domain";

type SummaryCardsProps = { readonly tasks: readonly Task[] };
type MetricTone = "neutral" | "warning" | "success";

const METRIC_ICON_TONES = {
    neutral: "bg-secondary text-foreground",
    warning: "bg-secondary text-warning",
    success: "bg-secondary text-success",
} as const satisfies Record<MetricTone, string>;

export function SummaryCards({ tasks }: SummaryCardsProps) {
    const completed = tasks.filter((task) => task.status === "selesai").length;
    const unfinished = tasks.length - completed;
    const progress =
        tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    return (
        <section className="mx-auto mb-6 grid max-w-[93.75rem] gap-3 md:grid-cols-3 md:gap-4" aria-label="Ringkasan tugas">
            <MetricCard
                icon={<ClipboardText />}
                label="Semua tugas"
                tone="neutral"
                value={tasks.length}
                note="Semester aktif"
            />
            <MetricCard
                icon={<ClockCountdown />}
                label="Belum selesai"
                tone="warning"
                value={unfinished}
                note="Perlu perhatian"
            />
            <MetricCard
                icon={<CheckCircle />}
                label="Selesai"
                tone="success"
                value={completed}
                note={`${progress}% dari semua tugas`}
            />
        </section>
    );
}

type MetricCardProps = {
    readonly icon: React.ReactNode;
    readonly label: string;
    readonly tone: MetricTone;
    readonly value: number;
    readonly note: string;
};

function MetricCard({ icon, label, tone, value, note }: MetricCardProps) {
    return (
        <Card className="flex-row items-center gap-4 rounded-md border-border bg-card p-4 md:p-5">
            <span className={`grid size-13 shrink-0 place-items-center rounded-md [&_svg]:size-7 ${METRIC_ICON_TONES[tone]}`} aria-hidden="true">
                {icon}
            </span>
            <span className="grid">
                <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
                <strong className="text-[1.75rem] leading-tight tracking-[-0.04em] tabular-nums">{value}</strong>
                <small className="text-xs text-subtle">{note}</small>
            </span>
        </Card>
    );
}
