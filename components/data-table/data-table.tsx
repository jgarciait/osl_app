"use client"

import { type ColumnDef, flexRender, type Table as ReactTable } from "@tanstack/react-table"
import type React from "react"

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  table: ReactTable<TData>
  columns: ColumnDef<TData, TValue>[]
  onRowClick?: (row: TData) => void
  onRowRightClick?: (e: React.MouseEvent, row: TData) => void
  canEdit?: boolean
  tagMap?: Record<string, string> // Nuevo prop para mapear IDs de etiquetas a nombres
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onRowClick,
  onRowRightClick,
  canEdit,
  tagMap = {}, // Valor por defecto vacío
}: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border mt-2 w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => {
            // Skip rendering the checkbox column
            if (headerGroup.headers.find((header) => header.id.includes("select"))) {
              const selectHeader = headerGroup.headers.find((header) => header.id.includes("select"))
              if (selectHeader) {
                selectHeader.column.columnDef.header = () => null
              }
            }
            return (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  // Skip rendering the checkbox column
                  if (header.id.includes("select")) return null

                  let headerContent =
                    header.id === "actions"
                      ? "Opciones"
                      : flexRender(header.column.columnDef.header, header.getContext())

                  // Change the header name of the last column to "Opciones"
                  if (header === headerGroup.headers[headerGroup.headers.length - 1]) {
                    headerContent = "Opciones"
                  }

                  if (header.id === "document_tags") {
                    headerContent = "Etiquetas"
                  }

                  return <TableCell key={header.id}>{headerContent}</TableCell>
                })}
              </TableRow>
            )
          })}
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
                {row.getVisibleCells().map((cell) => {
                  // Skip rendering the checkbox column cell
                  if (cell.column.id.includes("select")) return null

                  return (
                    <TableCell key={cell.id}>
                      {cell.column.id.includes("document_tags") || cell.column.id.includes("etiqueta")
                        ? (() => {
                            const value = cell.getValue()
                            if (Array.isArray(value)) {
                              return value
                                .map((tagId) => {
                                  // Intentar obtener el nombre de la etiqueta del mapa
                                  const tagName = tagMap[tagId]
                                  // Si existe el nombre, mostrarlo, de lo contrario mostrar el ID
                                  return tagName || tagId
                                })
                                .join(", ")
                            } else if (typeof value === "string") {
                              // Si es un string único, intentar obtener el nombre
                              return tagMap[value as string] || value
                            } else {
                              // Para cualquier otro caso, renderizar normalmente
                              return flexRender(cell.column.columnDef.cell, cell.getContext())
                            }
                          })()
                        : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
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
