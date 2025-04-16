import { EtiquetasTable } from "@/components/etiquetas-table"
import { EtiquetasForm } from "@/components/etiquetas-form"
import { createServerClient } from "@/lib/supabase-server"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

async function getEtiquetas() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("etiquetas").select("*").order("nombre", { ascending: true })

    if (error) {
      console.error("Error al obtener etiquetas:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error in getEtiquetas:", error)
    return []
  }
}

export default async function EtiquetasPage() {
  noStore()
  const etiquetas = await getEtiquetas()

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <EtiquetasForm />
            <EtiquetasTable etiquetas={Array.isArray(etiquetas) ? etiquetas : []} />
          </div>
        </div>
      </div>
    </>
  )
}
