"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle, PanelLeft } from "lucide-react"
import { useSidebarContext } from "@/components/app-sidebar"
// Añadir la importación del hook useGroupPermissions
import { useGroupPermissions } from "@/hooks/use-group-permissions"

export function DashboardHeader() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebarContext()

  // Añadir verificación de permisos
  const { hasPermission } = useGroupPermissions()
  const canManageExpressions = hasPermission("expressions", "manage")

  // Determinar si mostrar el botón de nueva expresión (ahora también verifica permisos)
  const showNewButton = pathname === "/dashboard/expresiones" && canManageExpressions

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold">
          {pathname === "/dashboard" && "Dashboard"}
          {pathname === "/dashboard/expresiones" && "Expresiones"}
          {pathname.includes("/dashboard/expresiones/nueva") && "Nueva Expresión"}
          {pathname.includes("/dashboard/expresiones") && pathname.includes("/editar") && "Editar Expresión"}
          {pathname === "/dashboard/comites" && "Comisiones, Senadores y Representantes"}
          {pathname === "/dashboard/temas" && "Temas"}
          {pathname === "/dashboard/etiquetas" && "Etiquetas"}
          {pathname === "/dashboard/reportes" && "Reportes"}
          {pathname === "/dashboard/settings" && "Configuración"}
          {pathname === "/dashboard/perfil" && "Perfil"}
        </h1>
      </div>
      {showNewButton && (
        <Link href="/dashboard/expresiones/nueva">
          <Button className="bg-[#1a365d] hover:bg-[#15294d]">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Expresión
          </Button>
        </Link>
      )}
    </header>
  )
}
