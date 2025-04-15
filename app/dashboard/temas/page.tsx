import { createServerClient } from "@/lib/supabase-server"
import { TemasTable } from "@/components/temas-table"
import { TemaForm } from "@/components/tema-form"
import { cookies } from "next/headers"

export default async function TemasPage() {
  const cookieStore = cookies()
  const supabase = createServerClient()

  // Fetch temas
  const { data: temas, error } = await supabase.from("temas").select("*").order("nombre", { ascending: true })

  if (error) {
    console.error("Error fetching temas:", error)
  }

  // Verificar permisos del usuario
  const { data: userPermissions } = await supabase.rpc("get_user_permissions")
  const canManageTemas =
    userPermissions?.some((permission) => permission.resource === "temas" && permission.action === "manage") || false

  return (
    <div className="w-full py-6 px-4">
      <div className="space-y-6">
        
        {canManageTemas && (
          <div>
            <p className="text-muted-foreground">Administre los temas para clasificar las expresiones ciudadanas</p>
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          {canManageTemas && <TemaForm />}
          <TemasTable temas={temas || []} />
        </div>
      </div>
    </div>
  )
}
