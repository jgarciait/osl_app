import { ReportesForm } from "@/components/reportes-form"
import { useGroupPermissions } from "@/hooks/use-group-permissions"
import { createServerClient } from "@/lib/supabase-server"

async function ReportesContent() {
  const supabase = createServerClient()
  const { data: years } = await supabase.from("expresiones").select("ano").order("ano", { ascending: false })
  const { data: comites } = await supabase.from("comites").select("*").order("nombre", { ascending: true })
  const uniqueYears = years ? [...new Set(years.map((y) => y.ano))] : [new Date().getFullYear()]

  return <ReportesForm years={uniqueYears} comites={comites || []} />
}

export default function ReportesPage() {
  const { hasPermission } = useGroupPermissions()
  const canManageReports = hasPermission("reports", "manage")

  return (
    <>
      <div className="w-full py-6 px-4">
        {canManageReports ? (
          <div className="space-y-6">
            <ReportesContent />
          </div>
        ) : (
          <p>No tiene permiso para ver esta sección.</p>
        )}
      </div>
    </>
  )
}
