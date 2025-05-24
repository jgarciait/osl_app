"use client"

import type { ReactNode } from "react"
import { memo } from "react"
import { useCachedPermissions } from "@/hooks/use-cached-permissions"

interface OptimizedPermissionGuardProps {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
  showLoading?: boolean
}

const OptimizedPermissionGuardComponent = ({
  resource,
  action,
  children,
  fallback = null,
  showLoading = false,
}: OptimizedPermissionGuardProps) => {
  const { hasPermission, loading } = useCachedPermissions()

  // Show loading state only if explicitly requested
  if (loading && showLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded" />
  }

  // If still loading but not showing loading state, don't render anything
  if (loading) {
    return null
  }

  // Check permission (this will use cache if available)
  const hasAccess = hasPermission(resource, action)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Memoize the component to prevent unnecessary rerenders
export const OptimizedPermissionGuard = memo(OptimizedPermissionGuardComponent)
