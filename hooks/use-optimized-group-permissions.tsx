"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClientClient } from "@/lib/supabase-client"

type Permission = {
  id: string
  name: string
  resource: string
  action: string
}

type UserGroup = {
  id: string
  name: string
  description?: string
}

type PermissionsState = {
  permissions: Permission[]
  userGroups: UserGroup[]
  isAdmin: boolean
  loading: boolean
  error: string | null
  lastFetch: number
}

type GroupPermissionsContextType = {
  hasPermission: (resource: string, action: string) => boolean
  canManage: (resource: string) => boolean
  canView: (resource: string) => boolean
  canCreate: (resource: string) => boolean
  canEdit: (resource: string) => boolean
  canDelete: (resource: string) => boolean
  userGroups: UserGroup[]
  userPermissions: Permission[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  refreshPermissions: () => Promise<void>
}

const GroupPermissionsContext = createContext<GroupPermissionsContextType>({
  hasPermission: () => false,
  canManage: () => false,
  canView: () => false,
  canCreate: () => false,
  canEdit: () => false,
  canDelete: () => false,
  userGroups: [],
  userPermissions: [],
  loading: true,
  error: null,
  isAdmin: false,
  refreshPermissions: async () => {},
})

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const CACHE_KEY = "optimized_permissions_cache_v4"

export function OptimizedGroupPermissionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PermissionsState>({
    permissions: [],
    userGroups: [],
    isAdmin: false,
    loading: true,
    error: null,
    lastFetch: 0,
  })

  const fetchInProgress = useRef(false)
  const supabase = createClientClient()

  // Memoized permission checkers
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (state.loading) return false
      if (state.isAdmin) return true

      return state.permissions.some((permission) => {
        const resourceMatch = permission.resource === resource || permission.resource === "*"
        const actionMatch = permission.action === action || permission.action === "*"
        return resourceMatch && actionMatch
      })
    },
    [state.permissions, state.isAdmin, state.loading],
  )

  const canManage = useCallback((resource: string) => hasPermission(resource, "manage"), [hasPermission])
  const canView = useCallback((resource: string) => hasPermission(resource, "view"), [hasPermission])
  const canCreate = useCallback((resource: string) => hasPermission(resource, "create"), [hasPermission])
  const canEdit = useCallback((resource: string) => hasPermission(resource, "edit"), [hasPermission])
  const canDelete = useCallback((resource: string) => hasPermission(resource, "delete"), [hasPermission])

  // Optimized function to fetch permissions using separate queries
  const fetchPermissionsOptimized = useCallback(
    async (userId: string) => {
      console.log("Fetching permissions for user:", userId)

      try {
        // Step 1: Get user's groups
        const { data: userGroupsData, error: userGroupsError } = await supabase
          .from("user_groups")
          .select(`
            group_id,
            groups (
              id,
              name,
              description
            )
          `)
          .eq("user_id", userId)

        if (userGroupsError) {
          console.error("User groups error:", userGroupsError)
          throw userGroupsError
        }

        console.log("User groups data:", userGroupsData)

        const userGroups = userGroupsData?.map((ug) => ug.groups).filter(Boolean) || []
        const groupIds = userGroupsData?.map((ug) => ug.group_id).filter(Boolean) || []
        const isAdmin = userGroups.some((group) => group?.name === "admin")

        console.log("Group IDs:", groupIds)
        console.log("Is admin:", isAdmin)

        // Step 2: Get permissions for these groups (only if we have groups)
        let permissions: Permission[] = []

        if (groupIds.length > 0) {
          const { data: groupPermissionsData, error: groupPermissionsError } = await supabase
            .from("group_permissions")
            .select(`
              permission_id,
              permissions (
                id,
                name,
                resource,
                action
              )
            `)
            .in("group_id", groupIds)

          if (groupPermissionsError) {
            console.error("Group permissions error:", groupPermissionsError)
            throw groupPermissionsError
          }

          console.log("Group permissions data:", groupPermissionsData)

          // Extract and deduplicate permissions
          const allPermissions = groupPermissionsData?.map((gp) => gp.permissions).filter(Boolean) || []

          // Deduplicate by permission ID
          const uniquePermissions = allPermissions.filter(
            (permission, index, self) => index === self.findIndex((p) => p?.id === permission?.id),
          )

          permissions = uniquePermissions
        }

        console.log("Final permissions:", permissions)

        return {
          permissions,
          groups: userGroups,
          is_admin: isAdmin,
        }
      } catch (error) {
        console.error("Optimized fetch error:", error)
        throw error
      }
    },
    [supabase],
  )

  const fetchPermissions = useCallback(
    async (forceRefresh = false) => {
      // Prevent concurrent fetches
      if (fetchInProgress.current && !forceRefresh) return

      try {
        fetchInProgress.current = true

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!session?.user) {
          setState((prev) => ({ ...prev, loading: false, error: "No authenticated user" }))
          return
        }

        const userId = session.user.id
        const now = Date.now()

        // Check cache first
        if (!forceRefresh) {
          try {
            const cachedData = localStorage.getItem(CACHE_KEY)
            if (cachedData) {
              const parsed = JSON.parse(cachedData)
              if (parsed.userId === userId && now - parsed.timestamp < CACHE_TTL) {
                console.log("Using cached permissions")
                setState({
                  permissions: parsed.permissions || [],
                  userGroups: parsed.userGroups || [],
                  isAdmin: parsed.isAdmin || false,
                  loading: false,
                  error: null,
                  lastFetch: parsed.timestamp,
                })
                return
              }
            }
          } catch (cacheError) {
            console.warn("Cache read error:", cacheError)
          }
        }

        setState((prev) => ({ ...prev, loading: true, error: null }))

        // Fetch permissions using optimized method
        const permissionData = await fetchPermissionsOptimized(userId)

        const newState = {
          permissions: permissionData?.permissions || [],
          userGroups: permissionData?.groups || [],
          isAdmin: permissionData?.is_admin || false,
          loading: false,
          error: null,
          lastFetch: now,
        }

        setState(newState)

        // Cache the results
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              ...newState,
              userId,
              timestamp: now,
            }),
          )
          console.log("Permissions cached successfully")
        } catch (cacheError) {
          console.warn("Cache write error:", cacheError)
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to fetch permissions",
        }))
      } finally {
        fetchInProgress.current = false
      }
    },
    [supabase, fetchPermissionsOptimized],
  )

  const refreshPermissions = useCallback(() => {
    console.log("Refreshing permissions...")
    return fetchPermissions(true)
  }, [fetchPermissions])

  // Initial fetch
  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      hasPermission,
      canManage,
      canView,
      canCreate,
      canEdit,
      canDelete,
      userGroups: state.userGroups,
      userPermissions: state.permissions,
      loading: state.loading,
      error: state.error,
      isAdmin: state.isAdmin,
      refreshPermissions,
    }),
    [
      hasPermission,
      canManage,
      canView,
      canCreate,
      canEdit,
      canDelete,
      state.userGroups,
      state.permissions,
      state.loading,
      state.error,
      state.isAdmin,
      refreshPermissions,
    ],
  )

  return <GroupPermissionsContext.Provider value={contextValue}>{children}</GroupPermissionsContext.Provider>
}

export function useOptimizedGroupPermissions() {
  const context = useContext(GroupPermissionsContext)
  if (!context) {
    throw new Error("useOptimizedGroupPermissions must be used within OptimizedGroupPermissionsProvider")
  }
  return context
}
