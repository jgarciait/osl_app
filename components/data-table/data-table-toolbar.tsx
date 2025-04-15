"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  statusOptions: { label: string; value: string; icon?: any }[]
  yearOptions: { label: string; value: string }[]
  monthOptions: { label: string; value: string }[]
  assignedUserOptions?: { label: string; value: string }[]
  searchPlaceholder?: string
}

export function DataTableToolbar<TData>({
  table,
  statusOptions,
  yearOptions,
  monthOptions,
  assignedUserOptions,
  searchPlaceholder = "Buscar...",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Obtener el valor actual del filtro global
  const globalFilter = table.getState().globalFilter || ""

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between py-4">
      <div className="flex flex-wrap gap-2">
        {table.getColumn("estado") && (
          <DataTableFacetedFilter column={table.getColumn("estado")} title="Estatus" options={statusOptions} />
        )}
        {table.getColumn("ano") && (
          <DataTableFacetedFilter column={table.getColumn("ano")} title="Año" options={yearOptions} />
        )}
        {table.getColumn("mes") && (
          <DataTableFacetedFilter column={table.getColumn("mes")} title="Mes" options={monthOptions} />
        )}
        {table.getColumn("assigned_to_name") && assignedUserOptions && assignedUserOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("assigned_to_name")}
            title="Asignado a"
            options={assignedUserOptions}
          />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center">
        <Input
          placeholder="Buscar por número, nombre, email o tema..."
          value={globalFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
    </div>
  )
}
