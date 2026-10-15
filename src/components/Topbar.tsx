import {
    Bell,
    GearSix,
    MagnifyingGlass,
    Moon,
    Sun,
} from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { ThemeChoice } from "../domain";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAccount } from "@/auth/Provider";
import type { ThemeTransitionOrigin } from "@/hooks/useThemeChoice";
import { IconButton } from "./Button";

type TopbarProps = {
    readonly search: string;
    readonly notificationCount: number;
    readonly theme: ThemeChoice;
    readonly onSearch: (value: string) => void;
    readonly onOpenNotifications: () => void;
    readonly onToggleTheme: (origin: ThemeTransitionOrigin) => void;
    readonly onOpenSettings: () => void;
};

export function Topbar({
    search,
    notificationCount,
    theme,
    onSearch,
    onOpenNotifications,
    onToggleTheme,
    onOpenSettings,
}: TopbarProps) {
    const profileName = useAccount().displayName;
    const notificationLabel =
        notificationCount > 0
            ? `Buka notifikasi, ${notificationCount} belum dibaca`
            : "Buka notifikasi";
    const notificationBadge = notificationCount > 9 ? "9+" : notificationCount;
    const searchRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const handleSearchShortcut = (event: KeyboardEvent) => {
            const target = event.target;
            const editing =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
            if (
                event.key === "/" &&
                !editing &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                event.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleSearchShortcut);
        return () =>
            window.removeEventListener("keydown", handleSearchShortcut);
    }, []);
    return (
        <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center justify-between gap-2 border-b border-divider bg-background/90 px-4 backdrop-blur-xl md:static md:min-h-20 md:gap-4 md:px-8 md:backdrop-blur-none">
            <SidebarTrigger
                aria-label="Buka atau lipat navigasi"
                className="size-11 shrink-0"
            />
            <label
                className="flex min-h-11 min-w-0 max-w-lg flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 transition-shadow focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 dark:focus-within:ring-accent"
                htmlFor="global-search"
            >
                <MagnifyingGlass className="text-subtle" aria-hidden="true" />
                <span className="sr-only">Cari tugas atau mata kuliah</span>
                <Input
                    ref={searchRef}
                    id="global-search"
                    onChange={(event) => onSearch(event.currentTarget.value)}
                    className="min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    placeholder="Cari tugas atau mata kuliah..."
                    type="search"
                    value={search}
                />
                <kbd className="hidden rounded-sm border border-border px-2 text-xs text-subtle sm:block">
                    /
                </kbd>
            </label>
            <div className="flex items-center gap-0 sm:gap-2">
                <IconButton
                    icon={<GearSix />}
                    label="Pengaturan tampilan"
                    onClick={onOpenSettings}
                />
                <IconButton
                    icon={theme === "dark" ? <Sun /> : <Moon />}
                    label={
                        theme === "dark"
                            ? "Gunakan tema terang"
                            : "Gunakan tema gelap"
                    }
                    onClick={(event) => {
                        const bounds =
                            event.currentTarget.getBoundingClientRect();
                        onToggleTheme({
                            x: bounds.left + bounds.width / 2,
                            y: bounds.top + bounds.height / 2,
                        });
                    }}
                />
                <IconButton
                    icon={
                        <span className="relative grid size-5 place-items-center">
                            <Bell />
                            {notificationCount > 0 ? (
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[0.625rem] font-extrabold leading-none text-white ring-2 ring-background"
                                >
                                    {notificationBadge}
                                </span>
                            ) : null}
                        </span>
                    }
                    label={notificationLabel}
                    onClick={onOpenNotifications}
                />
                <Avatar
                    className="hidden size-10 sm:flex"
                    aria-label={`Profil ${profileName}`}
                >
                    <AvatarFallback className="bg-secondary font-extrabold text-foreground">
                        {profileName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
