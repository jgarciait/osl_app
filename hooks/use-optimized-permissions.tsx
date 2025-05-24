"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClientClient } from "@/lib/supabase-client"

type Permission = {
  resource: string
  action: string
  name: string
}

type PermissionsCache = {
  permissions: Permission[]
  userGroups: string[]
  isAdmin: boolean
  timestamp: number
  userId: string
}

type OptimizedPermissionsContextType = {
  hasPermission: (resource: string, action: string) => boolean
  isInGroup: (groupName: string) => boolean
  userGroups: string[]
  userPermissions: Permission[]
  loading: boolean
  isAdmin: boolean
  refreshPermissions: () => Promise<void>
}

const OptimizedPermissionsContext = createContext<OptimizedPermissionsContextType>({
  hasPermission: () => false,
  isInGroup: () => false,
  userGroups: [],
  userPermissions: [],
  loading: true,
  isAdmin: false,
  refreshPermissions: async () => {},
})

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY = "permissions_cache"

export function OptimizedPermissionsProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<PermissionsCache | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoized permission checker
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (!cache) return false

      // Admin has all permissions
      if (cache.isAdmin) return true

      // Check specific permission
      return cache.permissions.some((permission) => permission.resource === resource && permission.action === action)
    },
    [cache],
  )

  // Memoized group checker
  const isInGroup = useCallback(
    (groupName: string): boolean => {
      return cache?.userGroups.includes(groupName) ?? false
    },
    [cache],
  )

  const fetchPermissions = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = createClientClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      const userId = session.user.id

      // Check cache first
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const parsed: PermissionsCache = JSON.parse(cachedData)
          const isValid = parsed.userId === userId && Date.now() - parsed.timestamp < CACHE_TTL

          if (isValid) {
            setCache(parsed)
            setLoading(false)
            return
          }
        }
      }

      // Batch all permission-related queries
      const [adminCheck, userGroupsData, permissionsData] = await Promise.all([
        supabase.rpc("is_admin", { user_id: userId }),
        supabase.rpc("get_user_groups", { user_id: userId }),
        supabase
          .from("group_permissions")
          .select(`
            permissions (
              id,
              name,
              resource,
              action
            )
          `)
          .in(
            "group_id",
            // We'll need to get group IDs first, but this is a simplified version
            [],
          ),
      ])

      const isAdmin = !!adminCheck.data
      const userGroups = userGroupsData.data?.map((g: any) => g.group_name) || []

      // Get permissions for user's groups
      const groupIds = userGroupsData.data?.map((g: any) => g.group_id) || []

      let permissions: Permission[] = []
      if (groupIds.length > 0) {
        const { data: permsData } = await supabase
          .from("group_permissions")
          .select(`
            permissions (
              id,
              name,
              resource,
              action
            )
          `)
          .in("group_id", groupIds)

        // Deduplicate permissions
        const uniquePermissions = new Map()
        permsData?.forEach((item: any) => {
          if (item.permissions) {
            const key = `${item.permissions.resource}:${item.permissions.action}`
            uniquePermissions.set(key, {
              resource: item.permissions.resource,
              action: item.permissions.action,
              name: item.permissions.name,
            })
          }
        })
        permissions = Array.from(uniquePermissions.values())
      }

      const newCache: PermissionsCache = {
        permissions,
        userGroups,
        isAdmin,
        timestamp: Date.now(),
        userId,
      }

      setCache(newCache)
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))
    } catch (error) {
      console.error("Error fetching permissions:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPermissions = useCallback(() => fetchPermissions(true), [fetchPermissions])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      hasPermission,
      isInGroup,
      userGroups: cache?.userGroups || [],
      userPermissions: cache?.permissions || [],
      loading,
      isAdmin: cache?.isAdmin || false,
      refreshPermissions,
    }),
    [hasPermission, isInGroup, cache, loading, refreshPermissions],
  )

  return <OptimizedPermissionsContext.Provider value={contextValue}>{children}</OptimizedPermissionsContext.Provider>
}

export function useOptimizedPermissions() {
  const context = useContext(OptimizedPermissionsContext)
  if (!context) {
    throw new Error("useOptimizedPermissions must be used within OptimizedPermissionsProvider")
  }
  return context
}
