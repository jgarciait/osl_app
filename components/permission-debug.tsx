"use client"

import { useEffect, useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PermissionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const debugPermissions = async () => {
      try {
        const supabase = createClientClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setDebugInfo({ error: "No session found" })
          setLoading(false)
          return
        }

        const userId = session.user.id

        // Check if user is admin
        const { data: isAdminData, error: adminError } = await supabase.rpc("is_admin", { user_id: userId })

        // Get user groups
        const { data: userGroupsData, error: groupsError } = await supabase.rpc("get_user_groups", {
          user_id: userId,
        })

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        // Get all permissions for user's groups
        let permissionsData = []
        if (userGroupsData && userGroupsData.length > 0) {
          const groupIds = userGroupsData.map((g: any) => g.group_id)
          const { data: permsData, error: permsError } = await supabase
            .from("group_permissions")
            .select(`
              group_id,
              permissions (
                id,
                name,
                resource,
                action,
                description
              )
            `)
            .in("group_id", groupIds)

          permissionsData = permsData || []
        }

        // Test specific permission checks
        const testPermissions = [
          { resource: "expressions", action: "view" },
          { resource: "committees", action: "view" },
          { resource: "topics", action: "view" },
          { resource: "classifications", action: "view" },
          { resource: "tags", action: "view" },
          { resource: "reports", action: "view" },
          { resource: "settings", action: "view" },
          { resource: "documents", action: "view" },
          { resource: "audit_trail", action: "view" },
        ]

        const permissionTests = await Promise.all(
          testPermissions.map(async (perm) => {
            const { data, error } = await supabase.rpc("user_has_permission", {
              user_id: userId,
              resource: perm.resource,
              action: perm.action,
            })
            return {
              ...perm,
              hasPermission: data,
              error: error?.message,
            }
          }),
        )

        setDebugInfo({
          userId,
          session: session.user,
          isAdmin: isAdminData,
          adminError: adminError?.message,
          userGroups: userGroupsData,
          groupsError: groupsError?.message,
          profile: profileData,
          profileError: profileError?.message,
          permissions: permissionsData,
          permissionTests,
        })
      } catch (error) {
        setDebugInfo({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    debugPermissions()
  }, [])

  if (loading) {
    return <div>Loading debug info...</div>
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Permission Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo.error && <div className="text-red-500">Error: {debugInfo.error}</div>}

          <div>
            <h3 className="font-semibold">User ID:</h3>
            <p className="font-mono text-sm">{debugInfo.userId}</p>
          </div>

          <div>
            <h3 className="font-semibold">Is Admin:</h3>
            <Badge variant={debugInfo.isAdmin ? "default" : "secondary"}>{debugInfo.isAdmin ? "Yes" : "No"}</Badge>
            {debugInfo.adminError && <p className="text-red-500 text-sm">Error: {debugInfo.adminError}</p>}
          </div>

          <div>
            <h3 className="font-semibold">User Groups:</h3>
            {debugInfo.userGroups && debugInfo.userGroups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {debugInfo.userGroups.map((group: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {group.group_name} (ID: {group.group_id})
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-yellow-600">No groups assigned</p>
            )}
            {debugInfo.groupsError && <p className="text-red-500 text-sm">Error: {debugInfo.groupsError}</p>}
          </div>

          <div>
            <h3 className="font-semibold">Profile:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.profile, null, 2)}
            </pre>
            {debugInfo.profileError && <p className="text-red-500 text-sm">Error: {debugInfo.profileError}</p>}
          </div>

          <div>
            <h3 className="font-semibold">Group Permissions:</h3>
            {debugInfo.permissions && debugInfo.permissions.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.permissions.map((perm: any, index: number) => (
                  <div key={index} className="border p-2 rounded">
                    <p className="font-medium">Group ID: {perm.group_id}</p>
                    {perm.permissions && (
                      <div className="mt-1">
                        <Badge variant="outline">
                          {perm.permissions.resource}:{perm.permissions.action}
                        </Badge>
                        <p className="text-sm text-gray-600">{perm.permissions.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-600">No permissions found</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Permission Tests:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {debugInfo.permissionTests?.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">
                    {test.resource}:{test.action}
                  </span>
                  <Badge variant={test.hasPermission ? "default" : "destructive"}>
                    {test.hasPermission ? "✓" : "✗"}
                  </Badge>
                  {test.error && <span className="text-red-500 text-xs">{test.error}</span>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
