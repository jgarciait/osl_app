"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useGroupPermissions } from "@/hooks/use-group-permissions"

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY = "permissions_cache_simple"

type CachedPermissionsState = {
  permissions: Record<string, boolean>
  loading: boolean
  lastFetch: number
}

export function useCachedPermissions() {
  const [cache, setCache] = useState<CachedPermissionsState>({
    permissions: {},
    loading: true,
    lastFetch: 0,
  })

  const { hasPermission: originalHasPermission, loading: originalLoading } = useGroupPermissions()

  // Check if cache is valid
  const isCacheValid = useMemo(() => {
    const now = Date.now()
    return cache.lastFetch > 0 && now - cache.lastFetch < CACHE_TTL
  }, [cache.lastFetch])

  // Memoized permission checker that uses cache
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      const key = `${resource}:${action}`

      // If we have a cached result and cache is valid, use it
      if (isCacheValid && key in cache.permissions) {
        return cache.permissions[key]
      }

      // If still loading original permissions, return false
      if (originalLoading) {
        return false
      }

      // Get fresh result and cache it
      const result = originalHasPermission(resource, action)

      // Update cache
      setCache((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [key]: result,
        },
        loading: false,
        lastFetch: Date.now(),
      }))

      return result
    },
    [originalHasPermission, originalLoading, cache.permissions, isCacheValid],
  )

  // Clear cache when original loading state changes (user login/logout)
  useEffect(() => {
    if (originalLoading) {
      setCache({
        permissions: {},
        loading: true,
        lastFetch: 0,
      })
    }
  }, [originalLoading])

  // Derived permission functions
  const canView = useCallback((resource: string) => hasPermission(resource, "view"), [hasPermission])
  const canEdit = useCallback((resource: string) => hasPermission(resource, "edit"), [hasPermission])
  const canCreate = useCallback((resource: string) => hasPermission(resource, "create"), [hasPermission])
  const canDelete = useCallback((resource: string) => hasPermission(resource, "delete"), [hasPermission])
  const canManage = useCallback((resource: string) => hasPermission(resource, "manage"), [hasPermission])

  return {
    hasPermission,
    canView,
    canEdit,
    canCreate,
    canDelete,
    canManage,
    loading: originalLoading || cache.loading,
  }
}
