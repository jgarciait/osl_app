"use client"

import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  statusOptions: { label: string; value: string }[]
  yearOptions: { label: string; value: string }[]
  monthOptions: { label: string; value: string }[]
  assignedUserOptions?: { label: string; value: string }[]
  tagOptions?: { label: string; value: string; color?: string }[]
  globalFilter: string
  setGlobalFilter: (value: string) => void
  hideStatusFilter?: boolean
}

export function DataTableToolbar<TData>({
  table,
  statusOptions,
  yearOptions,
  monthOptions,
  assignedUserOptions,
  tagOptions,
  globalFilter,
  setGlobalFilter,
  hideStatusFilter,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {statusOptions.length > 0 && !hideStatusFilter && (
          <DataTableFacetedFilter column={table.getColumn("estado")} title="Estado" options={statusOptions} />
        )}
        {yearOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("year")} title="Año" options={yearOptions} />
        )}
        {monthOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("month")} title="Mes" options={monthOptions} />
        )}
        {assignedUserOptions && assignedUserOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("assignedUser")}
            title="Asignado a"
            options={assignedUserOptions}
          />
        )}
        {tagOptions && tagOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("tags")} title="Etiquetas" options={tagOptions} />
        )}
        {isFiltered && (
          <button className="text-muted-foreground hover:underline" onClick={() => table.resetColumnFilters()}>
            Reset
          </button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
