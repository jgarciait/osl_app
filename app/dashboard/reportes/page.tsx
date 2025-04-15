"use client"

import { ReportesForm } from "@/components/reportes-form"
import { useGroupPermissions } from "@/hooks/use-group-permissions"
import { createClientClient } from "@/lib/supabase-server"
import { useState, useEffect } from "react"

function ReportesPage() {
  const [years, setYears] = useState([])
  const [comites, setComites] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const { hasPermission } = useGroupPermissions()
  const canManageReports = hasPermission("reports", "manage")
  const supabase = createClientClient()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
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
  }, [supabase])

  if (!hasMounted) {
    return null
  }

  return (
    <>
      <div className="w-full py-6 px-4">
        {canManageReports ? (
          <div className="space-y-6">
            {loading ? <div>Loading...</div> : <ReportesForm years={years} comites={comites} />}
          </div>
        ) : (
          <p>No tiene permiso para ver esta sección.</p>
        )}
      </div>
    </>
  )
}

export default ReportesPage
