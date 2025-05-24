"use client"

import type React from "react"
import { memo } from "react"
import { useGroupPermissions } from "@/hooks/use-group-permissions"

interface PermissionGuardProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showDebug?: boolean
}

// Memoize the component to prevent unnecessary rerenders
export const PermissionGuard = memo<PermissionGuardProps>(function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  showDebug = false,
}) {
  const { hasPermission, loading, isAdmin } = useGroupPermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded" />
  }

  const hasAccess = hasPermission(resource, action)

  if (showDebug) {
    console.log(`[PERMISSION] ${resource}:${action} = ${hasAccess} (admin: ${isAdmin})`)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
})
