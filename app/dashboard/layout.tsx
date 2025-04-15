import type React from "react"
import { AppSidebar, SidebarProvider } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { GroupPermissionsProvider } from "@/hooks/use-group-permissions"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GroupPermissionsProvider>
      <SidebarProvider>
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <div className="flex-1 overflow-y-auto">
              <DashboardHeader />
              <main className="p-4 md:p-6">{children}</main>
            </div>
          </div>
        </ProtectedRoute>
      </SidebarProvider>
    </GroupPermissionsProvider>
  )
}
