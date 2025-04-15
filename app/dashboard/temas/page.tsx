"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { TemasTable } from "@/components/temas-table"
import { TemaForm } from "@/components/tema-form"
import { useGroupPermissions } from "@/hooks/use-group-permissions"

export default function TemasPage() {
  const { hasPermission } = useGroupPermissions()
  const canManageTemas = hasPermission("topics", "manage")
  const [temas, setTemas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemas = async () => {
      setLoading(true)
      try {
        const supabase = createClientClient()
        const { data, error } = await supabase.from("temas").select("*").order("nombre", { ascending: true })

        if (error) {
          console.error("Error fetching temas:", error)
        }

        setTemas(data || [])
      } finally {
        setLoading(false)
      }
    }

    fetchTemas()
  }, [])

  return (
    <div className="w-full py-6 px-4">
      <div className="space-y-6">
        {canManageTemas && (
          <div>
            <p className="text-muted-foreground">Administre los temas para clasificar las expresiones ciudadanas</p>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {canManageTemas && <TemaForm />}
          <TemasTable temas={temas} />
        </div>
      </div>
    </div>
  )
}
