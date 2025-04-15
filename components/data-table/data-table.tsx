"use client"
import { type ColumnDef, flexRender, type Table as ReactTable } from "@tanstack/react-table"
import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  table: ReactTable<TData>
  columns: ColumnDef<TData, TValue>[]
  onRowClick?: (row: TData) => void
  onRowRightClick?: (e: React.MouseEvent, row: TData) => void
  canEdit?: boolean
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  onRowRightClick,
  canEdit,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : header.column.columnDef.header === "Nombre"
                      ? "Ciudadano"
                      : header.column.columnDef.header === ""
                        ? "Opciones"
                        : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick && canEdit !== false && onRowClick(row.original)}
                onContextMenu={(e) => onRowRightClick && onRowRightClick(e, row.original)}
                className={
                  (onRowClick && canEdit !== false) || onRowRightClick
                    ? "cursor-pointer hover:bg-gray-50"
                    : "hover:bg-gray-50"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
