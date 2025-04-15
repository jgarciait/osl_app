import { createServerClient } from "@/lib/supabase-server"
import { EtiquetasTable } from "@/components/etiquetas-table"
import { EtiquetasForm } from "@/components/etiquetas-form"

export default async function EtiquetasPage() {
  const supabase = createServerClient()

  // Obtener etiquetas
  const { data: etiquetas, error } = await supabase.from("etiquetas").select("*").order("nombre", { ascending: true })

  if (error) {
    console.error("Error al obtener etiquetas:", error)
  }

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <EtiquetasForm />
            <EtiquetasTable etiquetas={etiquetas || []} />
          </div>
        </div>
      </div>
    </>
  )
}
