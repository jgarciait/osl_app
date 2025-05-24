"use client"

import { useOptimizedGroupPermissions } from "@/hooks/use-optimized-group-permissions"
import { SimplePermissionGuard } from "@/components/simple-permission-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPermissionsPage() {
  const {
    userGroups,
    userPermissions,
    loading,
    error,
    isAdmin,
    refreshPermissions,
    hasPermission,
    canView,
    canManage,
  } = useOptimizedGroupPermissions()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Debug Permissions</h1>
        <Button onClick={refreshPermissions} disabled={loading}>
          {loading ? "Loading..." : "Refresh Permissions"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Loading: {loading ? "Yes" : "No"}</div>
              <div>Is Admin: {isAdmin ? "Yes" : "No"}</div>
              <div>Groups Count: {userGroups.length}</div>
              <div>Permissions Count: {userPermissions.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {userGroups.length > 0 ? (
              <ul className="space-y-1">
                {userGroups.map((group) => (
                  <li key={group.id} className="text-sm">
                    {group.name} {group.description && `(${group.description})`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No groups assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {userPermissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {userPermissions.map((permission) => (
                <div key={permission.id} className="text-sm border p-2 rounded">
                  <div className="font-medium">{permission.name}</div>
                  <div className="text-gray-600">
                    {permission.resource}:{permission.action}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No permissions found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimplePermissionGuard resource="expresiones" action="view" showDebug={true}>
            <div className="p-2 bg-green-100 rounded">✅ Can view expresiones</div>
          </SimplePermissionGuard>

          <SimplePermissionGuard resource="expresiones" action="manage" showDebug={true}>
            <div className="p-2 bg-green-100 rounded">✅ Can manage expresiones</div>
          </SimplePermissionGuard>

          <SimplePermissionGuard resource="temas" action="view" showDebug={true}>
            <div className="p-2 bg-green-100 rounded">✅ Can view temas</div>
          </SimplePermissionGuard>

          <SimplePermissionGuard resource="referidos" action="manage" showDebug={true}>
            <div className="p-2 bg-green-100 rounded">✅ Can manage referidos</div>
          </SimplePermissionGuard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Permission Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>View Expresiones: {canView("expresiones") ? "✅" : "❌"}</div>
            <div>Manage Expresiones: {canManage("expresiones") ? "✅" : "❌"}</div>
            <div>View Temas: {canView("temas") ? "✅" : "❌"}</div>
            <div>Manage Temas: {canManage("temas") ? "✅" : "❌"}</div>
            <div>View Referidos: {canView("referidos") ? "✅" : "❌"}</div>
            <div>Manage Referidos: {canManage("referidos") ? "✅" : "❌"}</div>
            <div>View Notas: {canView("notas") ? "✅" : "❌"}</div>
            <div>Manage Notas: {canManage("notas") ? "✅" : "❌"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
