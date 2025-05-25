"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Table } from "@tanstack/react-table"

import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  statusOptions?: { label: string; value: string }[]
  yearOptions?: { label: string; value: string }[]
  monthOptions?: { label: string; value: string }[]
  assignedUserOptions?: { label: string; value: string }[]
  tagOptions?: { label: string; value: string; color?: string }[]
  globalFilter?: string
  setGlobalFilter?: (value: string) => void
  disabled?: boolean
}

export function DataTableToolbar<TData>({
  table,
  statusOptions = [],
  yearOptions = [],
  monthOptions = [],
  assignedUserOptions = [],
  tagOptions = [],
  globalFilter,
  setGlobalFilter,
  disabled = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {!disabled && (
          <>
            {table.getColumn("estado") && (
              <DataTableFacetedFilter column={table.getColumn("estado")} title="Estatus" options={statusOptions} />
            )}

            {table.getColumn("ano") && (
              <DataTableFacetedFilter column={table.getColumn("ano")} title="Año" options={yearOptions} />
            )}

            {table.getColumn("mes") && (
              <DataTableFacetedFilter column={table.getColumn("mes")} title="Mes" options={monthOptions} />
            )}

            {table.getColumn("assigned_to_name") && (
              <DataTableFacetedFilter
                column={table.getColumn("assigned_to_name")}
                title="Asignado a"
                options={assignedUserOptions}
              />
            )}

            {table.getColumn("document_tags") && tagOptions.length > 0 && (
              <DataTableFacetedFilter
                column={table.getColumn("document_tags")}
                title="Etiquetas"
                options={tagOptions}
              />
            )}

            {isFiltered && (
              <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                Limpiar
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {disabled && <div className="text-sm text-gray-500 italic">Filtros desactivados durante la búsqueda</div>}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
