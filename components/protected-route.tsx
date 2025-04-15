"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientClient } from "@/lib/supabase-client"
import { useGroupPermissions } from "@/hooks/use-group-permissions"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: {
    resource: string
    action: string
  }
  requiredGroup?: string
  fallbackUrl?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredGroup,
  fallbackUrl = "/login",
}: ProtectedRouteProps) {
  const router = useRouter()
  const { hasPermission, isInGroup, loading, isAdmin } = useGroupPermissions()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push(fallbackUrl)
        return
      }

      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router, fallbackUrl])

  // Si está cargando o aún no se ha verificado la autenticación
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si el usuario es administrador, siempre tiene acceso
  if (isAdmin) {
    return <>{children}</>
  }

  // Verificar permisos si se requieren
  if (requiredPermission) {
    const { resource, action } = requiredPermission
    if (!hasPermission(resource, action)) {
      router.push(fallbackUrl)
      return null
    }
  }

  // Verificar grupo si se requiere
  if (requiredGroup && !isInGroup(requiredGroup)) {
    router.push(fallbackUrl)
    return null
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>
}
