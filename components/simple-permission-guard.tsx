"use client"

import { useOptimizedGroupPermissions } from "@/hooks/use-optimized-group-permissions"
import type { ReactNode } from "react"

interface SimplePermissionGuardProps {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
  showDebug?: boolean
}

export function SimplePermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  showDebug = false,
}: SimplePermissionGuardProps) {
  const { hasPermission, loading, error, isAdmin, userPermissions, userGroups } = useOptimizedGroupPermissions()

  if (loading) {
    return <div className="text-sm text-gray-500">Verificando permisos...</div>
  }

  if (error) {
    if (showDebug) {
      return <div className="text-sm text-red-500 p-2 border border-red-200 rounded">Error: {error}</div>
    }
    return fallback
  }

  const hasAccess = hasPermission(resource, action)

  if (showDebug) {
    return (
      <div className="border border-blue-200 p-4 rounded mb-4">
        <div className="text-sm mb-2">
          <strong>Permission Check Debug:</strong>
        </div>
        <div className="text-xs space-y-1">
          <div>Resource: {resource}</div>
          <div>Action: {action}</div>
          <div>Has Access: {hasAccess ? "✅ Yes" : "❌ No"}</div>
          <div>Is Admin: {isAdmin ? "✅ Yes" : "❌ No"}</div>
          <div>User Groups: {userGroups.map((g) => g.name).join(", ") || "None"}</div>
          <div>Permissions Count: {userPermissions.length}</div>
          <div>
            Relevant Permissions:{" "}
            {userPermissions
              .filter((p) => p.resource === resource || p.resource === "*")
              .map((p) => `${p.resource}:${p.action}`)
              .join(", ") || "None"}
          </div>
        </div>
        {hasAccess ? children : fallback}
      </div>
    )
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
