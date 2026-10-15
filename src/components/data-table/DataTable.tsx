"use client"

import { useState, useEffect } from "react"
import { flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from "@tanstack/react-table"
import { CaretLeft, CaretRight, SlidersHorizontal } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DataTableProps<T> = {
  readonly columns: ColumnDef<T>[]
  readonly data: T[]
  readonly labels: Readonly<Record<string, string>>
  readonly initialSorting?: SortingState
  readonly emptyMessage?: string
}

export function DataTable<T>({ columns, data, labels, initialSorting = [], emptyMessage = "Tidak ada tugas yang cocok." }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [visibility, setVisibility] = useState<VisibilityState>({})
  const [query, setQuery] = useState("")
  const table = useReactTable({ data, columns, state: { sorting, columnVisibility: visibility, globalFilter: query },
    onSortingChange: setSorting, onColumnVisibilityChange: setVisibility, onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, autoResetPageIndex: false,
  })
  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex
  useEffect(() => { if (pageIndex >= pageCount && pageIndex > 0) table.setPageIndex(Math.max(0, pageCount - 1)) }, [pageCount, pageIndex, table])

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3 px-3 py-4 md:px-5">
        <Input className="min-w-0 max-w-96" aria-label="Cari dalam tabel" placeholder="Cari tugas atau anggota..." value={query} onChange={(event) => { setQuery(event.currentTarget.value); table.setPageIndex(0) }} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button className="ml-auto" variant="outline" type="button"><SlidersHorizontal />Kolom</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(value)}>{labels[column.id] ?? column.id}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full overflow-x-auto border-y border-border">
        <Table className="min-w-[50rem]">
          <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>
            {group.headers.map((header) => <TableHead className="border-b border-divider px-4 py-3 text-xs text-muted-foreground" key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
          </TableRow>)}</TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow className="hover:bg-muted" key={row.id}>
              {row.getVisibleCells().map((cell) => <TableCell className="border-b border-divider px-4 py-3 align-middle whitespace-normal" key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
            </TableRow>) : <TableRow><TableCell colSpan={table.getVisibleLeafColumns().length} className="h-32 text-center">{emptyMessage}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-4 text-xs text-muted-foreground md:px-5">
        <span>{table.getFilteredRowModel().rows.length} baris · Halaman {pageCount ? pageIndex + 1 : 0} dari {pageCount}</span>
        <div className="flex items-center gap-2">
          <Select value={String(table.getState().pagination.pageSize)} onValueChange={(value) => { table.setPageSize(Number(value)); table.setPageIndex(0) }}>
            <SelectTrigger aria-label="Jumlah baris per halaman"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50].map((value) => <SelectItem key={value} value={String(value)}>{value} baris</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><CaretLeft /></Button>
          <Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><CaretRight /></Button>
        </div>
      </div>
    </div>
  )
}
