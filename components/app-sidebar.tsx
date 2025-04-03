"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Users, Settings, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Sesión cerrada",
      description: "Ha cerrado sesión exitosamente",
    })
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    {
      title: "Expresiones",
      icon: FileText,
      href: "/dashboard/expresiones",
      isActive: pathname === "/dashboard/expresiones" || pathname.startsWith("/dashboard/expresiones/"),
    },
    {
      title: "Comités",
      icon: Users,
      href: "/dashboard/comites",
      isActive: pathname === "/dashboard/comites",
    },
    {
      title: "Perfil",
      icon: Settings,
      href: "/dashboard/perfil",
      isActive: pathname === "/dashboard/perfil",
    },
  ]

  return (
    <Sidebar variant="inset" className="border-r border-border">
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Logo Oficina de Servicios Legislativos"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-bold">Sistema LEX</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="mr-2 h-5 w-5" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

