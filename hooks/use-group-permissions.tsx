"use client"

import { useState, useEffect, createContext, useContext, type ReactNode, useMemo, useCallback, useRef } from "react"
import { createClientClient } from "@/lib/supabase-client"

// Definir el contexto de permisos
type PermissionsContextType = {
  checkPermission: (resource: string, action: string) => Promise<boolean>
  hasPermission: (resource: string, action: string) => boolean
  userGroups: string[]
  userPermissions: { resource: string; action: string }[]
  loading: boolean
  isAdmin: boolean
}

const PermissionsContext = createContext<PermissionsContextType>({
  checkPermission: async () => false,
  hasPermission: () => false,
  userGroups: [],
  userPermissions: [],
  loading: true,
  isAdmin: false,
})

// Cache for permissions to prevent duplicate requests
const permissionsCache = new Map<
  string,
  {
    data: PermissionsContextType
    timestamp: number
  }
>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Proveedor del contexto de permisos
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [userGroups, setUserGroups] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<{ resource: string; action: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const fetchingRef = useRef(false)

  // Memoized permission checker
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (loading) return false
      if (isAdmin) return true

      return userPermissions.some((permission) => permission.resource === resource && permission.action === action)
    },
    [userPermissions, loading, isAdmin],
  )

  // Memoized async permission checker (for backward compatibility)
  const checkPermission = useCallback(
    async (resource: string, action: string): Promise<boolean> => {
      return hasPermission(resource, action)
    },
    [hasPermission],
  )

  useEffect(() => {
    const fetchUserPermissions = async () => {
      // Prevent duplicate fetches
      if (fetchingRef.current) return
      fetchingRef.current = true

      try {
        const supabase = createClientClient()

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoading(false)
          fetchingRef.current = false
          return
        }

        const userId = session.user.id

        // Check cache first
        const cacheKey = `permissions_${userId}`
        const cached = permissionsCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setUserGroups(cached.data.userGroups)
          setUserPermissions(cached.data.userPermissions)
          setIsAdmin(cached.data.isAdmin)
          setLoading(false)
          fetchingRef.current = false
          return
        }

        // Check if user is admin
        const { data: adminCheck } = await supabase.rpc("is_admin", { user_id: userId })
        const userIsAdmin = adminCheck === true
        setIsAdmin(userIsAdmin)

        if (userIsAdmin) {
          // Admin has all permissions
          setUserGroups(["admin"])
          setUserPermissions([])
          setLoading(false)

          // Cache admin status
          permissionsCache.set(cacheKey, {
            data: {
              userGroups: ["admin"],
              userPermissions: [],
              loading: false,
              isAdmin: true,
              hasPermission,
              checkPermission,
            },
            timestamp: Date.now(),
          })
          fetchingRef.current = false
          return
        }

        // Get user groups
        const { data: userGroupsData, error: userGroupsError } = await supabase
          .from("user_groups")
          .select(`
            id,
            group_id,
            user_id,
            groups (
              id,
              name
            )
          `)
          .eq("user_id", userId)

        if (userGroupsError) {
          console.error("Error fetching user groups:", userGroupsError)
          setLoading(false)
          fetchingRef.current = false
          return
        }

        const groupIds = userGroupsData?.map((item) => item.group_id) || []
        const groupNames = userGroupsData?.map((item) => item.groups?.name).filter(Boolean) || []
        setUserGroups(groupNames)

        if (groupIds.length === 0) {
          setLoading(false)
          fetchingRef.current = false
          return
        }

        // Get permissions for groups
        const { data: permissionsData, error: permissionsError } = await supabase
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

        if (permissionsError) {
          console.error("Error fetching permissions:", permissionsError)
          setLoading(false)
          fetchingRef.current = false
          return
        }

        // Extract unique permissions
        const uniquePermissions = new Map()
        permissionsData?.forEach((item) => {
          if (item.permissions) {
            const key = `${item.permissions.resource}:${item.permissions.action}`
            uniquePermissions.set(key, {
              resource: item.permissions.resource,
              action: item.permissions.action,
            })
          }
        })

        const permissions = Array.from(uniquePermissions.values())
        setUserPermissions(permissions)

        // Cache the results
        permissionsCache.set(cacheKey, {
          data: {
            userGroups: groupNames,
            userPermissions: permissions,
            loading: false,
            isAdmin: userIsAdmin,
            hasPermission,
            checkPermission,
          },
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error("Error in fetchUserPermissions:", error)
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    fetchUserPermissions()
  }, [hasPermission, checkPermission])

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      checkPermission,
      hasPermission,
      userGroups,
      userPermissions,
      loading,
      isAdmin,
    }),
    [checkPermission, hasPermission, userGroups, userPermissions, loading, isAdmin],
  )

  return <PermissionsContext.Provider value={contextValue}>{children}</PermissionsContext.Provider>
}

// Hook para usar el contexto de permisos
export function useGroupPermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error("useGroupPermissions must be used within a PermissionsProvider")
  }
  return context
}
