"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { useOptimizedGroupPermissions } from "@/hooks/use-optimized-group-permissions"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay],
  )
}

interface OptimizedExpresionesTableProps {
  expresiones: any[]
  years: number[]
  tagMap?: Record<string, string>
}

export function OptimizedExpresionesTable({ expresiones, years, tagMap = {} }: OptimizedExpresionesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  // Use optimized permissions
  const { canView, canEdit, canDelete, canManage, loading: permissionsLoading } = useOptimizedGroupPermissions()

  const [sorting, setSorting] = useState<SortingState>([{ id: "numero", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([{ id: "estado", value: ["Activa"] }])
  const [rowSelection, setRowSelection] = useState({})

  // Debounced handlers to prevent excessive API calls
  const debouncedHandleEdit = useDebounce((id: string) => {
    router.push(`/dashboard/expresiones/${id}/editar`)
  }, 300)

  const debouncedHandleView = useDebounce((id: string) => {
    router.push(`/dashboard/expresiones/${id}/ver`)
  }, 300)

  const debouncedHandleDelete = useDebounce(async (id: string) => {
    // Implement delete logic
    console.log("Delete:", id)
  }, 300)

  // Memoized columns to prevent recreation on every render
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "numero",
        header: "Número",
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "tema_nombre",
        header: "Tema",
      },
      {
        accessorKey: "estado",
        header: "Estatus",
        accessorFn: (row) => (row.archivado ? "Archivada" : "Activa"),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const expresion = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canView("expressions") && (
                  <DropdownMenuItem onClick={() => debouncedHandleView(expresion.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </DropdownMenuItem>
                )}
                {canEdit("expressions") && (
                  <DropdownMenuItem onClick={() => debouncedHandleEdit(expresion.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDelete("expressions") && (
                  <DropdownMenuItem onClick={() => debouncedHandleDelete(expresion.id)} className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canView, canEdit, canDelete, debouncedHandleView, debouncedHandleEdit, debouncedHandleDelete],
  )

  const table = useReactTable({
    data: expresiones,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  if (permissionsLoading) {
    return <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />
  }

  return (
    <div className="w-full">
      <DataTable table={table} columns={columns} />
      <DataTablePagination table={table} />
    </div>
  )
}
