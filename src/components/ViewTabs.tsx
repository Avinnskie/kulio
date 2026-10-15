import { CalendarDots, Kanban, Table } from "@phosphor-icons/react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ViewMode } from "../domain";

type ViewTabsProps = {
    readonly value: ViewMode;
};

export function ViewTabs({ value }: ViewTabsProps) {
    const items = [
        { value: "board", label: "Board", icon: <Kanban /> },
        { value: "tabel", label: "Tabel", icon: <Table /> },
        { value: "kalender", label: "Kalender", icon: <CalendarDots /> },
    ] as const;

    return (
        <TabsList
            className="flex h-auto w-full gap-1 rounded-sm bg-muted p-1 sm:w-auto"
            aria-label="Tampilan tugas"
        >
            {items.map((item) => (
                <TabsTrigger
                    className="min-h-8 flex-1 gap-2 rounded-[0.25rem] px-3 text-[0.8125rem] font-bold text-muted-foreground active:scale-[0.97] data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card motion-reduce:transform-none [&_svg]:size-4 max-[24rem]:[&_span]:hidden"
                    data-active={value === item.value}
                    key={item.value}
                    value={item.value}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </TabsTrigger>
            ))}
        </TabsList>
    );
}
