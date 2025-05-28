"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, FilterX } from "lucide-react"
import { Cross2Icon } from "@radix-ui/react-icons"

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
  onGlobalSearch?: (searchTerm: string) => void
  currentUser?: any
  isFilteringByCurrentUser?: boolean
  onToggleCurrentUserFilter?: () => void
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
  onGlobalSearch,
  currentUser,
  isFilteringByCurrentUser,
  onToggleCurrentUserFilter,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {currentUser && onToggleCurrentUserFilter && (
          <Button
            variant={isFilteringByCurrentUser ? "default" : "outline"}
            size="sm"
            onClick={onToggleCurrentUserFilter}
            className={isFilteringByCurrentUser ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {isFilteringByCurrentUser ? (
              <>
                <FilterX className="mr-2 h-4 w-4" />
                Ver todas
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Ver mis asignaciones
              </>
            )}
          </Button>
        )}
        {isFilteringByCurrentUser && currentUser && (
          <Badge variant="secondary" className="ml-2">
            Filtrando: Mis asignaciones
          </Badge>
        )}
        {statusOptions.length > 0 && !hideStatusFilter && (
          <DataTableFacetedFilter column={table.getColumn("estado")} title="Estado" options={statusOptions} />
        )}
        {table.getColumn("ano") && yearOptions && yearOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("ano")} title="Año" options={yearOptions} />
        )}
        {table.getColumn("mes") && monthOptions && monthOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("mes")} title="Mes" options={monthOptions} />
        )}
        {table.getColumn("assigned_to_name") && assignedUserOptions && assignedUserOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("assigned_to_name")}
            title="Asignado a"
            options={assignedUserOptions}
          />
        )}
        {table.getColumn("document_tags") && tagOptions && tagOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("document_tags")} title="Etiquetas" options={tagOptions} />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
