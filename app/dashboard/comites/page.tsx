import { createServerClient } from "@/lib/supabase-server"
import { ComitesTable } from "@/components/comites-table"
import { ComiteForm } from "@/components/comite-form"

export default async function ComitesPage() {
  const supabase = createServerClient()

  // Fetch committees
  const { data: comites, error } = await supabase
    .from("comites")
    .select("*")
    .order("tipo", { ascending: true })
    .order("nombre", { ascending: true })

  if (error) {
    console.error("Error fetching committees:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comisiones</h1>
        <p className="text-muted-foreground">Administre los comités del Senado y la Cámara</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ComiteForm />
        <ComitesTable comites={comites || []} />
      </div>
    </div>
  )
}

