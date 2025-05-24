"use client"

import { useEffect, useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugPermissionsSchema() {
  const [schemaInfo, setSchemaInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientClient()

  useEffect(() => {
    async function checkSchema() {
      try {
        // Check groups table structure
        const { data: groupsSample } = await supabase.from("groups").select("*").limit(1)

        // Check user_groups table
        const { data: userGroupsSample } = await supabase.from("user_groups").select("*").limit(1)

        // Check permissions table
        const { data: permissionsSample } = await supabase.from("permissions").select("*").limit(1)

        // Check group_permissions table
        const { data: groupPermissionsSample } = await supabase.from("group_permissions").select("*").limit(1)

        setSchemaInfo({
          groups: groupsSample?.[0] || "No data",
          userGroups: userGroupsSample?.[0] || "No data",
          permissions: permissionsSample?.[0] || "No data",
          groupPermissions: groupPermissionsSample?.[0] || "No data",
        })
      } catch (error) {
        console.error("Schema check error:", error)
        setSchemaInfo({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    checkSchema()
  }, [supabase])

  if (loading) return <div>Checking schema...</div>

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Database Schema Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(schemaInfo, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}
