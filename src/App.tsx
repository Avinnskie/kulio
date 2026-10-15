"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CourseProvider } from "@/courses/Provider";
import { useCollaboration } from "@/collaboration/Provider";
import { CollaborationPage } from "./components/collaboration/CollaborationPage";
import { useAccount } from "@/auth/Provider";
import { TaskActionsContext } from "./components/TaskActions";
import {
    TaskInspectionDialog,
    type TaskInspection,
} from "./components/TaskInspectionDialog";
import { TaskCloudFeedback } from "./components/TaskCloudFeedback";
import { useThemeChoice } from "./hooks/useThemeChoice";
import { useTasks } from "./hooks/useTasks";
import { AddTaskDialog } from "./components/AddTaskDialog";
import { BulkTaskDialog } from "./components/BulkTaskDialog";
import { CalendarPage } from "./components/CalendarPage";
import { CourseManagerDialog } from "./components/CourseManagerDialog";
import { DashboardView } from "./components/DashboardView";
import { MobileNav } from "./components/MobileNav";
import { NotificationDialog } from "./components/NotificationDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { Sidebar } from "./components/Sidebar";
import { TasksPage } from "./components/TasksPage";
import { Topbar } from "./components/Topbar";
import type {
    AppSection,
    CourseId,
    Task,
    TaskForm,
    TaskId,
    ViewMode,
} from "./domain";
import { notificationCapability, notifyDueTask } from "./lib/notifications";

export function App() {
    const collaboration = useCollaboration();
    const account = useAccount();
    const {
        tasks,
        saveTask,
        saveTasks,
        changeStatus,
        advanceTask,
        updateProgress,
        deleteTask,
        courses,
        saveCourse,
        deleteCourse,
        ready,
        loading,
        busy,
        error,
        refresh,
    } = useTasks(account.id);
    const [activeSection, setActiveSection] = useState<AppSection>(() =>
        new URL(window.location.href).searchParams.has("invite")
            ? "kolaborasi"
            : "ringkasan",
    );
    const [selectedCourse, setSelectedCourse] = useState<CourseId | "semua">(
        "semua",
    );
    const [viewMode, setViewMode] = useState<ViewMode>("board");
    const [search, setSearch] = useState("");
    const { theme, resolvedTheme, setTheme, setThemeFromOrigin } =
        useThemeChoice();
    const [dialog, setDialog] = useState<
        "add" | "bulk" | "courses" | "notifications" | "settings" | null
    >(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [inspection, setInspection] = useState<TaskInspection | null>(null);
    const inspectTask = useCallback((taskId: TaskId) => {
        setDialog(null);
        setInspection({ kind: "task", taskId, sourceDay: null });
    }, []);
    const inspectDay = useCallback((day: Date, taskIds: readonly TaskId[]) => {
        setDialog(null);
        setInspection({ kind: "day", day, taskIds });
    }, []);
    const notifiedTasks = useRef<Set<string>>(new Set());

    useEffect(() => {
        const checkDeadlines = () => {
            if (notificationCapability() !== "granted") return;
            const now = Date.now();
            for (const task of tasks) {
                const remaining = new Date(task.dueAt).getTime() - now;
                if (
                    task.status !== "selesai" &&
                    remaining > 0 &&
                    remaining <= 86_400_000 &&
                    !notifiedTasks.current.has(task.id)
                ) {
                    notifiedTasks.current.add(task.id);
                    notifyDueTask(task);
                }
            }
        };
        checkDeadlines();
        const interval = window.setInterval(checkDeadlines, 60_000);
        return () => window.clearInterval(interval);
    }, [tasks]);

    const visibleTasks = useMemo(() => {
        const query = search.trim().toLocaleLowerCase("id-ID");
        return tasks
            .filter(
                (task) =>
                    selectedCourse === "semua" ||
                    task.courseId === selectedCourse,
            )
            .filter((task) => {
                if (query === "") return true;
                const course = courses.find(
                    (item) => item.id === task.courseId,
                );
                return (
                    task.title.toLocaleLowerCase("id-ID").includes(query) ||
                    course?.name.toLocaleLowerCase("id-ID").includes(query)
                );
            })
            .slice()
            .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
    }, [courses, search, selectedCourse, tasks]);

    useEffect(() => {
        if (
            selectedCourse !== "semua" &&
            !courses.some((course) => course.id === selectedCourse)
        )
            setSelectedCourse("semua");
    }, [courses, selectedCourse]);

    const urgentCount = tasks.filter(
        (task) =>
            task.status !== "selesai" &&
            new Date(task.dueAt).getTime() - Date.now() <= 3 * 86_400_000,
    ).length;
    const editTask = (task: Task) => {
        setInspection(null);
        setEditingTask(task);
        setDialog("add");
    };
    const openNewTask = () => {
        setEditingTask(null);
        if (courses.length === 0) {
            setDialog("courses");
            toast.info("Tambahkan mata kuliah sebelum mencatat tugas.");
        } else setDialog("add");
    };
    const openBulkTasks = () => {
        setEditingTask(null);
        if (courses.length === 0) {
            setDialog("courses");
            toast.info("Tambahkan mata kuliah sebelum menyusun daftar tugas.");
        } else setDialog("bulk");
    };
    const selectCourse = (courseId: CourseId) => {
        setSelectedCourse(courseId);
        setActiveSection("semua");
    };

    const addTask = async (form: TaskForm) => {
        const saved = await saveTask(form, editingTask);
        if (saved) {
            setDialog(null);
            setEditingTask(null);
        }
        return saved;
    };
    const addTasks = async (forms: readonly TaskForm[]) => {
        const saved = await saveTasks(forms);
        if (saved) setDialog(null);
        return saved;
    };

    return (
        <CourseProvider courses={courses}>
            <TooltipProvider delayDuration={300}>
                <TaskActionsContext
                    value={{
                        onEdit: editTask,
                        onDelete: deleteTask,
                        onStatusChange: changeStatus,
                        onView: inspectTask,
                        onViewDay: inspectDay,
                    }}
                >
                    <SidebarProvider className="flex min-h-svh w-full md:max-h-svh">
                        <a
                            className="fixed left-3 top-3 z-[1000] -translate-y-[180%] rounded-sm bg-foreground px-4 py-3 font-bold text-background transition-transform focus:translate-y-0"
                            href="#main-content"
                        >
                            Lewati ke konten utama
                        </a>
                        <Sidebar
                            activeSection={activeSection}
                            selectedCourse={selectedCourse}
                            coursesReady={ready}
                            onNavigate={setActiveSection}
                            onSelectCourse={selectCourse}
                            onManageCourses={() => setDialog("courses")}
                            onOpenSettings={() => setDialog("settings")}
                        />
                        <SidebarInset className="min-h-0 min-w-0 flex-1 md:grid md:grid-rows-[auto_minmax(0,1fr)]">
                            <Topbar
                                search={search}
                                notificationCount={
                                    urgentCount +
                                    collaboration.inbox.filter(
                                        (item) => item.readAt === null,
                                    ).length
                                }
                                theme={resolvedTheme}
                                onSearch={setSearch}
                                onOpenNotifications={() =>
                                    setDialog("notifications")
                                }
                                onOpenSettings={() => setDialog("settings")}
                                onToggleTheme={(origin) =>
                                    setThemeFromOrigin(
                                        resolvedTheme === "dark"
                                            ? "light"
                                            : "dark",
                                        origin,
                                    )
                                }
                            />
                            <section
                                className="min-h-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:overflow-auto md:p-8 md:pb-8 [scrollbar-gutter:stable]"
                                id="main-content"
                                tabIndex={-1}
                            >
                                <TaskCloudFeedback
                                    ready={ready}
                                    loading={loading}
                                    busy={busy}
                                    error={error}
                                    onRetry={() => void refresh()}
                                />
                                {ready ? (
                                    <>
                                        {activeSection === "ringkasan" ? (
                                            <DashboardView
                                                tasks={visibleTasks}
                                                viewMode={viewMode}
                                                selectedCourse={selectedCourse}
                                                onViewMode={setViewMode}
                                                onSelectCourse={
                                                    setSelectedCourse
                                                }
                                                onAdd={openNewTask}
                                                onBulkAdd={openBulkTasks}
                                                onAdvance={advanceTask}
                                                onProgress={updateProgress}
                                                onViewAll={() =>
                                                    setActiveSection("semua")
                                                }
                                            />
                                        ) : null}
                                        {activeSection === "semua" ? (
                                            <TasksPage
                                                archived={false}
                                                tasks={visibleTasks.filter(
                                                    (task) =>
                                                        task.status !==
                                                        "selesai",
                                                )}
                                                onAdd={openNewTask}
                                                onBulkAdd={openBulkTasks}
                                                onAdvance={advanceTask}
                                                onProgress={updateProgress}
                                            />
                                        ) : null}
                                        {activeSection === "kalender" ? (
                                            <CalendarPage
                                                tasks={visibleTasks}
                                                onViewAll={() =>
                                                    setActiveSection("semua")
                                                }
                                            />
                                        ) : null}
                                        {activeSection === "arsip" ? (
                                            <TasksPage
                                                archived
                                                tasks={visibleTasks.filter(
                                                    (task) =>
                                                        task.status ===
                                                        "selesai",
                                                )}
                                                onAdd={openNewTask}
                                                onBulkAdd={openBulkTasks}
                                                onAdvance={advanceTask}
                                                onProgress={updateProgress}
                                            />
                                        ) : null}
                                        {activeSection === "kolaborasi" ? (
                                            <CollaborationPage
                                                search={search}
                                            />
                                        ) : null}
                                    </>
                                ) : null}
                            </section>
                        </SidebarInset>
                        <MobileNav
                            activeSection={activeSection}
                            onNavigate={setActiveSection}
                        />
                        {inspection ? (
                            <TaskInspectionDialog
                                selection={inspection}
                                tasks={tasks}
                                onSelect={setInspection}
                                onClose={() => setInspection(null)}
                                onProgress={updateProgress}
                            />
                        ) : null}
                        {dialog === "add" ? (
                            <AddTaskDialog
                                key={editingTask?.id ?? "new"}
                                open
                                initialTask={editingTask}
                                onClose={() => {
                                    setDialog(null);
                                    setEditingTask(null);
                                }}
                                onSubmit={addTask}
                            />
                        ) : null}
                        {dialog === "bulk" ? (
                            <BulkTaskDialog
                                open
                                onClose={() => setDialog(null)}
                                onSubmit={addTasks}
                            />
                        ) : null}
                        <NotificationDialog
                            open={dialog === "notifications"}
                            tasks={tasks}
                            onClose={() => setDialog(null)}
                            onOpenRoom={(groupId) => {
                                collaboration.setSelectedGroup(groupId);
                                setActiveSection("kolaborasi");
                                setDialog(null);
                            }}
                        />
                        <SettingsDialog
                            open={dialog === "settings"}
                            theme={theme}
                            onChange={setTheme}
                            onClose={() => setDialog(null)}
                        />
                        {dialog === "courses" ? (
                            <CourseManagerDialog
                                open={dialog === "courses"}
                                courses={courses}
                                busy={busy}
                                onClose={() => setDialog(null)}
                                onSave={async (form, existing) => {
                                    const saved = await saveCourse(
                                        form,
                                        existing,
                                    );
                                    if (saved) await collaboration.refresh();
                                    return saved;
                                }}
                                onDelete={deleteCourse}
                            />
                        ) : null}
                        <div className="sr-only" aria-live="polite">
                            {tasks.length} tugas tersimpan.
                        </div>
                        <Toaster
                            theme={resolvedTheme}
                            position="top-center"
                            richColors
                            closeButton
                        />
                    </SidebarProvider>
                </TaskActionsContext>
            </TooltipProvider>
        </CourseProvider>
    );
}
