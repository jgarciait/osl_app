import { Suspense } from "react"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { PermissionGuard } from "@/components/permission-guard"

export default function SettingsPage() {
  return (
    <PermissionGuard resource="settings" action="manage" fallback={<p>No tiene permiso para ver esta sección.</p>}>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">Administre la configuración del sistema</p>
          </div>

          <Suspense fallback={<div>Cargando...</div>}>
            <SettingsTabs />
          </Suspense>
        </div>
      </div>
    </PermissionGuard>
  )
}
