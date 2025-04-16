"use client"

import { ReportesForm } from "@/components/reportes-form"
import { useGroupPermissions } from "@/hooks/use-group-permissions"
import { createServerClient } from "@/lib/supabase-server"
import { useEffect, useState } from "react"

// Create a client component to use the useGroupPermissions hook
const ReportesContent = () => {
  const { hasPermission } = useGroupPermissions()
  const canManageReports = hasPermission("reports", "manage")
  const [years, setYears] = useState([])
  const [comites, setComites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const supabase = createServerClient()
        const { data: yearsData } = await supabase.from("expresiones").select("ano").order("ano", { ascending: false })
        const { data: comitesData } = await supabase.from("comites").select("*").order("nombre", { ascending: true })
        const uniqueYears = yearsData ? [...new Set(yearsData.map((y) => y.ano))] : [new Date().getFullYear()]

        setYears(uniqueYears)
        setComites(comitesData || [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (!canManageReports) {
    return <p>No tiene permiso para ver esta sección.</p>
  }

  return loading ? <div>Loading...</div> : <ReportesForm years={years} comites={comites} />
}

export default function ReportesPage() {
  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <ReportesContent />
        </div>
      </div>
    </>
  )
}
