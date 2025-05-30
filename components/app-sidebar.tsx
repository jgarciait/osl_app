"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  FileText,
  Landmark,
  Settings,
  LogOut,
  Home,
  BarChart,
  Tag,
  BookOpen,
  UserCog,
  Folder,
  Bug,
  RefreshCw,
  ClipboardList,
} from "lucide-react"
import Image from "next/image"
import { createContext, useContext, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

// Crear un contexto para el sidebar
const SidebarContext = createContext<{
  expanded: boolean
  toggleSidebar: () => void
}>({
  expanded: true,
  toggleSidebar: () => {},
})

// Hook para usar el contexto del sidebar
export const useSidebarContext = () => useContext(SidebarContext)

// Proveedor del contexto del sidebar
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(true)

  const toggleSidebar = () => {
    setExpanded((prev) => !prev)
  }

  return <SidebarContext.Provider value={{ expanded, toggleSidebar }}>{children}</SidebarContext.Provider>
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { expanded } = useSidebarContext()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClientClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        try {
          const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
          setUserRole("user") // Valor predeterminado en caso de error
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error)
          setUserRole("user") // Valor predeterminado en caso de error
        }
      }
    }

    fetchUserRole()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return // Prevenir múltiples clics

    setIsLoggingOut(true)

    try {
      // Crear una nueva instancia del cliente para cada operación
      const supabase = createClientClient()

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Limpiar almacenamiento local
      if (typeof window !== "undefined") {
        // Limpiar cualquier token o estado de autenticación
        localStorage.removeItem("supabase.auth.token")
        localStorage.removeItem("supabase.auth.expires_at")
        localStorage.removeItem("supabase.auth.refresh_token")

        // Limpiar cualquier otro estado de la aplicación si es necesario
        sessionStorage.clear()
      }

      // Mostrar mensaje de éxito
      toast({
        title: "Sesión cerrada",
        description: "Ha cerrado sesión exitosamente",
      })

      // Forzar recarga completa para limpiar cualquier estado en memoria
      window.location.href = "/login"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)

      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: "No se pudo cerrar la sesión correctamente. Redirigiendo al inicio de sesión.",
      })

      // Redirigir al login de todos modos
      window.location.href = "/login"
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Actualizar el array navItems para incluir el enlace a clasificaciones y bugs
  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      isActive: pathname === "/dashboard",
      // El Dashboard siempre es visible para usuarios autenticados
    },
    {
      title: "Expresiones",
      icon: FileText,
      href: "/dashboard/expresiones",
      isActive: pathname === "/dashboard/expresiones" || pathname.startsWith("/dashboard/expresiones/"),
      permission: { resource: "expressions", action: "view" },
    },
    {
      title: "Referidos",
      icon: Landmark,
      href: "/dashboard/comites",
      isActive: pathname === "/dashboard/comites",
      permission: { resource: "committees", action: "view" },
    },
    {
      title: "Temas",
      icon: BookOpen,
      href: "/dashboard/temas",
      isActive: pathname === "/dashboard/temas",
      permission: { resource: "topics", action: "view" },
    },
    {
      title: "Notas",
      icon: Folder,
      href: "/dashboard/clasificaciones",
      isActive: pathname === "/dashboard/clasificaciones",
      permission: { resource: "classifications", action: "view" },
    },
    {
      title: "Etiquetas",
      icon: Tag,
      href: "/dashboard/etiquetas",
      isActive: pathname === "/dashboard/etiquetas",
      permission: { resource: "tags", action: "view" },
    },
    {
      title: "Reportes",
      icon: BarChart,
      href: "/dashboard/reportes",
      isActive: pathname === "/dashboard/reportes",
      permission: { resource: "reports", action: "view" },
    },
    {
      title: "Bugs",
      icon: Bug,
      href: "/dashboard/bugs",
      isActive: pathname === "/dashboard/bugs" || pathname.startsWith("/dashboard/bugs/"),
      // Todos los usuarios pueden reportar bugs
    },
    {
      title: "Updates",
      icon: RefreshCw,
      href: "https://www.notion.so/1d04d385c26180da9147c0310f69509a?v=1d04d385c261801a9580000ce789446b&pvs=4",
      isActive: false,
      isExternal: true, // Indica que es un enlace externo
    },
    {
      title: "Configuración",
      icon: Settings,
      href: "/dashboard/settings",
      isActive: pathname === "/dashboard/settings",
      permission: { resource: "settings", action: "view" },
    },
    {
      title: "Perfil",
      icon: UserCog,
      href: "/dashboard/perfil",
      isActive: pathname === "/dashboard/perfil",
      // El perfil siempre es visible para usuarios autenticados
    },
    {
      title: "Documentos",
      icon: Folder,
      href: "/dashboard/documentos",
      isActive: pathname === "/dashboard/documentos",
      permission: { resource: "documents", action: "view" },
    },
    {
      title: "Auditoría",
      icon: ClipboardList,
      href: "/dashboard/audit_trail",
      isActive: pathname === "/dashboard/audit_trail",
      permission: { resource: "audit_trail", action: "view" }, // Permiso específico para ver auditoría
    },
  ]

  // En dispositivos móviles, ocultar el sidebar si no está expandido
  if (!expanded) {
    return null
  }

  return (
    <div className="w-[210px] min-w-[210px] bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="Logo Oficina de Servicios Legislativos"
            width={50}
            height={50}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold">OSL</span>
            <span className="text-xs text-muted-foreground">Oficina de Participación Ciudadana</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item) =>
            item.permission ? (
              <PermissionGuard
                key={item.href}
                resource={item.permission.resource}
                action={item.permission.action}
                fallback={null}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    item.isActive ? "bg-[#1a365d] text-white" : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              </PermissionGuard>
            ) : item.isExternal ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  item.isActive ? "bg-[#1a365d] text-white" : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            ),
          )}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200 bg-white w-full">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 w-full"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  )
}
