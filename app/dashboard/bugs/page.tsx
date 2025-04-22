import type { Metadata } from "next"
import { BugReportsTable } from "@/components/bug-reports-table"
import { Button } from "@/components/ui/button"
import { Bug, Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Reportes de Bugs | OSL",
  description: "Gestión de reportes de bugs y problemas de la aplicación",
}

export default function BugsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/bugs/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Reporte
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <BugReportsTable />
      </div>
    </div>
  )
}
