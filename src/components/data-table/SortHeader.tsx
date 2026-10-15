import { ArrowDown, ArrowUp, ArrowsDownUp } from "@phosphor-icons/react"
import type { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export function SortHeader<T>({ column, label }: { readonly column: Column<T>; readonly label: string }) {
  const direction = column.getIsSorted()
  return <Button variant="ghost" size="sm" className="min-h-10 px-0 font-bold [&_svg]:size-3.5" onClick={() => column.toggleSorting(direction === "asc")}>
    {label}{direction === "asc" ? <ArrowUp /> : direction === "desc" ? <ArrowDown /> : <ArrowsDownUp />}
    <span className="sr-only">{direction === "asc" ? "Urutan menaik" : direction === "desc" ? "Urutan menurun" : "Urutkan kolom"}</span>
  </Button>
}
