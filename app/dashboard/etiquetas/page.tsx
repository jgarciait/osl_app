import { EtiquetasTable } from "@/components/etiquetas-table"
import { EtiquetasForm } from "@/components/etiquetas-form"
import { safeSupabaseFetch } from "@/lib/supabase-helpers"

export default async function EtiquetasPage() {
  // Use safeSupabaseFetch to fetch etiquetas
  const etiquetas = await safeSupabaseFetch("etiquetas", "*")

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <EtiquetasForm />
            <EtiquetasTable etiquetas={etiquetas} />
          </div>
        </div>
      </div>
    </>
  )
}
