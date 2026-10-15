import { Archive, CalendarBlank, House, ListChecks, UsersThree } from "@phosphor-icons/react"
import type { AppSection } from "../domain"
import { Button } from "@/components/ui/button"

type MobileNavProps = {
  readonly activeSection: AppSection
  readonly onNavigate: (section: AppSection) => void
}

export function MobileNav({ activeSection, onNavigate }: MobileNavProps) {
  const items = [
    {
      section: "ringkasan",
      label: "Ringkasan",
      icon: <House weight={activeSection === "ringkasan" ? "fill" : "regular"} />,
    },
    {
      section: "semua",
      label: "Tugas",
      icon: <ListChecks weight={activeSection === "semua" ? "fill" : "regular"} />,
    },
    {
      section: "kalender",
      label: "Kalender",
      icon: <CalendarBlank weight={activeSection === "kalender" ? "fill" : "regular"} />,
    },
    {
      section: "arsip",
      label: "Arsip",
      icon: <Archive weight={activeSection === "arsip" ? "fill" : "regular"} />,
    },
  ] as const
  const collaborationItem = { section: "kolaborasi", label: "Kolaborasi", icon: <UsersThree weight={activeSection === "kolaborasi" ? "fill" : "regular"} /> } as const

  return (
    <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-lg border border-border bg-popover p-1 shadow-dialog md:hidden" aria-label="Navigasi bawah">
      {[...items, collaborationItem].map((item) => (
        <Button variant="ghost" className="grid min-h-14 place-items-center content-center gap-0.5 rounded-md px-1 text-[0.625rem] font-bold text-muted-foreground data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-active-foreground data-[active=true]:hover:bg-sidebar-active data-[active=true]:hover:text-sidebar-active-foreground [&_svg]:size-5"
          aria-current={activeSection === item.section ? "page" : undefined}
          data-active={activeSection === item.section}
          key={item.section}
          onClick={() => onNavigate(item.section)}
          type="button"
        >
          {item.icon}
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  )
}
