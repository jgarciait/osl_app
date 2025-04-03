import { createServerClient } from "@/lib/supabase-server"
import { ExpresionesTable } from "@/components/expresiones-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function ExpresionesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerClient()

  // Get filter parameters
  const status = (searchParams.status as string) || "active"
  const year = (searchParams.year as string) || new Date().getFullYear().toString()
  const month = (searchParams.month as string) || ""
  const page = Number.parseInt((searchParams.page as string) || "1")
  const pageSize = 10

  // Fetch expressions with filters
  let query = supabase
    .from("expresiones")
    .select(`
      *,
      expresion_comites(
        comite_id,
        comites(id, nombre, tipo)
      )
    `)
    .order("created_at", { ascending: false })

  if (status === "active") {
    query = query.eq("archivado", false)
  } else if (status === "archived") {
    query = query.eq("archivado", true)
  }

  if (year) {
    query = query.eq("ano", Number.parseInt(year))
  }

  if (month) {
    query = query.eq("mes", Number.parseInt(month))
  }

  // Calculate pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: expresiones, error, count } = await query.range(from, to).order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching expressions:", error)
  }

  // Get years for filter
  const { data: years } = await supabase.from("expresiones").select("ano").order("ano", { ascending: false }).limit(10)

  const uniqueYears = years ? [...new Set(years.map((y) => y.ano))] : [new Date().getFullYear()]

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Expresiones</h1>
        <Button asChild className="bg-[#1a365d] hover:bg-[#15294d]">
          <Link href="/dashboard/expresiones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Expresión
          </Link>
        </Button>
      </div>

      <ExpresionesTable
        expresiones={expresiones || []}
        status={status}
        year={year}
        month={month}
        page={page}
        pageSize={pageSize}
        totalCount={count || 0}
        years={uniqueYears}
      />
    </div>
  )
}

