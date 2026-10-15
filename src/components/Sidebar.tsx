import Image from "next/image";
import {
    Archive,
    CalendarBlank,
    GearSix,
    House,
    ListChecks,
    UsersThree,
    SignOut,
    CaretUpDown,
    PencilSimple,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAccount, useAuth } from "@/auth/Provider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCourses } from "@/courses/Provider";
import { CourseColorDot } from "@/components/CourseColorDot";
import { ThemeLogo } from "@/components/ThemeLogo";
import type { AppSection, CourseId } from "../domain";

type SidebarProps = {
    readonly activeSection: AppSection;
    readonly selectedCourse: CourseId | "semua";
    readonly coursesReady: boolean;
    readonly onNavigate: (section: AppSection) => void;
    readonly onSelectCourse: (courseId: CourseId) => void;
    readonly onManageCourses: () => void;
    readonly onOpenSettings: () => void;
};

const navigation = [
    { section: "ringkasan", label: "Ringkasan", icon: House },
    { section: "semua", label: "Semua tugas", icon: ListChecks },
    { section: "kalender", label: "Kalender", icon: CalendarBlank },
    { section: "arsip", label: "Arsip selesai", icon: Archive },
    { section: "kolaborasi", label: "Kolaborasi", icon: UsersThree },
] as const;

export function Sidebar({
    activeSection,
    selectedCourse,
    coursesReady,
    onNavigate,
    onSelectCourse,
    onManageCourses,
    onOpenSettings,
}: SidebarProps) {
    const { setOpenMobile } = useSidebar();
    const account = useAccount();
    const { busy, authenticate, error } = useAuth();
    const { courses } = useCourses();
    const navigate = (section: AppSection) => {
        onNavigate(section);
        setOpenMobile(false);
    };
    const name = account.displayName;
    return (
        <ShadcnSidebar
            collapsible="icon"
            className="border-r border-sidebar-border"
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a
                                href="#main-content"
                                className="flex min-h-11 items-center overflow-hidden"
                            >
                                <Image
                                    src="/favicon.png"
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="hidden size-8 shrink-0 object-contain group-data-[collapsible=icon]:block"
                                />
                                <span className="flex h-10 items-center group-data-[collapsible=icon]:hidden">
                                    <ThemeLogo priority className="h-10" />
                                </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Ruang kerja</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation.map((item) => (
                                <SidebarMenuItem key={item.section}>
                                    <SidebarMenuButton
                                        isActive={
                                            activeSection === item.section
                                        }
                                        tooltip={item.label}
                                        onClick={() => navigate(item.section)}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center justify-between pr-2">
                        <SidebarGroupLabel>Mata kuliah</SidebarGroupLabel>
                        <button
                            type="button"
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50"
                            aria-label="Kelola mata kuliah"
                            disabled={!coursesReady}
                            onClick={() => {
                                onManageCourses();
                                setOpenMobile(false);
                            }}
                        >
                            <PencilSimple className="size-4" />
                        </button>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {courses.map((course) => (
                                <SidebarMenuItem key={course.id}>
                                    <SidebarMenuButton
                                        isActive={selectedCourse === course.id}
                                        onClick={() => {
                                            onSelectCourse(course.id);
                                            setOpenMobile(false);
                                        }}
                                    >
                                        <CourseColorDot color={course.color} />
                                        <span>{course.name}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Pengaturan tampilan"
                            onClick={() => {
                                onOpenSettings();
                                setOpenMobile(false);
                            }}
                        >
                            <GearSix />
                            <span>Pengaturan tampilan</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" tooltip={name}>
                                    <Avatar className="size-8">
                                        <AvatarFallback>
                                            {name.slice(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex min-w-0 flex-col">
                                        <strong className="truncate">
                                            {name}
                                        </strong>
                                        <small className="truncate text-xs text-muted-foreground">
                                            {account.email}
                                        </small>
                                    </span>
                                    <CaretUpDown className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-64"
                            >
                                <DropdownMenuLabel className="flex flex-col gap-1">
                                    <span>{name}</span>
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                        {account.email}
                                    </span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => navigate("kolaborasi")}
                                >
                                    <UsersThree />
                                    Ruang kolaborasi
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={busy}
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        void authenticate({ action: "logout" });
                                    }}
                                >
                                    <SignOut />
                                    {busy ? "Keluar..." : "Keluar dari akun"}
                                </DropdownMenuItem>
                                {error ? (
                                    <p
                                        role="alert"
                                        className="px-2 py-2 text-xs text-destructive"
                                    >
                                        {error}
                                    </p>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </ShadcnSidebar>
    );
}
