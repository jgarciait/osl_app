"use client"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Edit, Eye } from "lucide-react"

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export function ExpresionesTable({
  expresiones,
  status = "active",
  year = new Date().getFullYear().toString(),
  month = "",
  page = 1,
  pageSize = 10,
  totalCount = 0,
  years = [new Date().getFullYear()],
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })

    return newParams.toString()
  }

  const handleStatusChange = (value: string) => {
    router.push(`${pathname}?${createQueryString({ status: value, page: "1" })}`)
  }

  const handleYearChange = (value: string) => {
    router.push(`${pathname}?${createQueryString({ year: value, page: "1" })}`)
  }

  const handleMonthChange = (value: string) => {
    router.push(`${pathname}?${createQueryString({ month: value, page: "1" })}`)
  }

  const handlePageChange = (newPage: number) => {
    router.push(`${pathname}?${createQueryString({ page: newPage.toString() })}`)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="archived">Archivadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Mes</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha Recibido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expresiones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron expresiones
                </TableCell>
              </TableRow>
            ) : (
              expresiones.map((expresion) => (
                <TableRow key={expresion.id}>
                  <TableCell className="font-medium">{expresion.numero}</TableCell>
                  <TableCell>{expresion.ano}</TableCell>
                  <TableCell>{MONTHS.find((m) => m.value === expresion.mes.toString())?.label}</TableCell>
                  <TableCell>{expresion.nombre}</TableCell>
                  <TableCell>{formatDate(expresion.fecha_recibido)}</TableCell>
                  <TableCell>
                    {expresion.archivado ? (
                      <Badge variant="outline" className="bg-gray-100">
                        Archivada
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/expresiones/${expresion.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/expresiones/${expresion.id}/editar`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <div className="text-sm">
            Página {page} de {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
        </div>
      )}
    </div>
  )
}

