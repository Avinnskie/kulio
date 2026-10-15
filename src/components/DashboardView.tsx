import { FunnelSimple, ListPlus, Plus } from "@phosphor-icons/react";
import { CourseColorDot } from "@/components/CourseColorDot";
import { useCourses } from "@/courses/Provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { VIEW_MODES } from "../domain";
import type { CourseId, Task, TaskId, ViewMode } from "../domain";
import { Button } from "./Button";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarPanel } from "./CalendarPanel";
import { SummaryCards } from "./SummaryCards";
import { TaskBoard } from "./TaskBoard";
import { TaskTable } from "./TaskTable";
import { UpcomingPanel } from "./UpcomingPanel";
import { ViewTabs } from "./ViewTabs";
import { useAccount } from "@/auth/Provider";

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
});

type DashboardViewProps = {
    readonly tasks: readonly Task[];
    readonly viewMode: ViewMode;
    readonly selectedCourse: CourseId | "semua";
    readonly onViewMode: (view: ViewMode) => void;
    readonly onSelectCourse: (courseId: CourseId | "semua") => void;
    readonly onAdd: () => void;
    readonly onBulkAdd: () => void;
    readonly onAdvance: (taskId: TaskId) => void;
    readonly onProgress: (taskId: TaskId, progress: number) => Promise<boolean>;
    readonly onViewAll: () => void;
};

export function DashboardView(props: DashboardViewProps) {
    const {
        tasks,
        viewMode,
        selectedCourse,
        onViewMode,
        onSelectCourse,
        onAdd,
        onBulkAdd,
        onAdvance,
        onProgress,
        onViewAll,
    } = props;
    const account = useAccount();
    const { courses } = useCourses();
    const firstName = account.displayName.split(" ")[0];
    const today = longDateFormatter.format(new Date());

    return (
        <>
            <section className="mx-auto flex max-w-[93.75rem] flex-col items-stretch justify-between gap-6 py-4 pb-6 md:flex-row md:items-end md:pb-8">
                <div>
                    <span className="mb-3 block text-[0.8125rem] capitalize text-muted-foreground">
                        {today}
                    </span>
                    <h1 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em]">
                        Selamat datang, {firstName}.
                    </h1>
                    <p className="mt-2 text-base text-muted-foreground md:text-[1.0625rem]">
                        Mari selesaikan yang paling penting hari ini.
                    </p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 md:flex md:w-auto">
                    <Button
                        icon={<ListPlus weight="bold" />}
                        onClick={onBulkAdd}
                        className="w-full md:w-auto"
                        variant="secondary"
                    >
                        Tambah banyak
                    </Button>
                    <Button
                        icon={<Plus weight="bold" />}
                        onClick={onAdd}
                        className="w-full md:w-auto"
                        variant="primary"
                    >
                        Tambah tugas
                    </Button>
                </div>
            </section>
            <SummaryCards tasks={tasks} />
            <div className="mx-auto grid max-w-[93.75rem] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)]">
                <Tabs
                    className="min-w-0 gap-0 overflow-hidden rounded-md border border-border bg-card dark:rounded-lg"
                    value={viewMode}
                    aria-labelledby="task-status-title"
                    onValueChange={(value) => {
                        const mode = VIEW_MODES.find((item) => item === value);
                        if (mode) onViewMode(mode);
                    }}
                >
                    <header className="flex flex-col items-start justify-between gap-4 border-b border-divider p-4 lg:flex-row lg:items-center lg:p-5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">
                                Ruang kerja
                            </span>
                            <h2
                                className="text-xl font-bold leading-[1.3] tracking-[-0.02em]"
                                id="task-status-title"
                            >
                                Tugas per status
                            </h2>
                        </div>
                        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto">
                            <ViewTabs value={viewMode} />
                            <Select
                                value={selectedCourse}
                                onValueChange={(value) =>
                                    onSelectCourse(
                                        value === "semua"
                                            ? "semua"
                                            : (courses.find(
                                                  (course) =>
                                                      course.id === value,
                                              )?.id ?? "semua"),
                                    )
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter mata kuliah"
                                    className="min-h-11 w-full bg-card text-[0.8125rem] sm:max-w-64"
                                >
                                    <FunnelSimple aria-hidden="true" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="semua">
                                        Semua mata kuliah
                                    </SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id}
                                        >
                                            <span className="flex items-center gap-2">
                                                <CourseColorDot
                                                    color={course.color}
                                                />
                                                {course.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </header>
                    <TabsContent value="board">
                        <TaskBoard
                            tasks={tasks}
                            onAdd={onAdd}
                            onAdvance={onAdvance}
                        />
                    </TabsContent>
                    <TabsContent value="tabel">
                        <TaskTable
                            tasks={tasks}
                            onAdvance={onAdvance}
                            onProgress={onProgress}
                        />
                    </TabsContent>
                    <TabsContent value="kalender">
                        <CalendarGrid tasks={tasks} />
                    </TabsContent>
                </Tabs>
                <aside
                    className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-1"
                    aria-label="Kalender dan tugas mendatang"
                >
                    <CalendarPanel tasks={tasks} />
                    <UpcomingPanel tasks={tasks} onViewAll={onViewAll} />
                </aside>
            </div>
        </>
    );
}
