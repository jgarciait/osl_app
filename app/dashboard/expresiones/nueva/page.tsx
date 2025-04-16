import { createServerClient } from "@/lib/supabase-server"
import { ExpresionForm } from "@/components/expresion-form"
import { safeSupabaseFetch } from "@/lib/supabase-helpers"

export default async function NuevaExpresionPage() {
  const supabase = await createServerClient()

  // Fetch committees for the form
  const comites = await safeSupabaseFetch("comites", "*")

  // Fetch temas for the form
  const temas = await safeSupabaseFetch("temas", "*")

  // Obtener todas las clasificaciones
  const clasificaciones = await safeSupabaseFetch("clasificaciones", "*")

  // Get the current year and next sequence number
  const currentYear = new Date().getFullYear()

  // Primero intentamos obtener la configuración de secuencia
  const { data: seqData } = await supabase.from("secuencia").select("valor").eq("id", "next_sequence").single()

  let nextSequence = 1

  if (seqData) {
    // Si hay configuración, la usamos
    nextSequence = Number.parseInt(seqData.valor, 10)
  } else {
    // Si no hay configuración, obtenemos la última expresión
    const { data: lastExpresion } = await supabase
      .from("expresiones")
      .select("sequence")
      .order("sequence", { ascending: false })
      .limit(1)

    // Si hay expresiones, usamos la última secuencia + 1
    if (lastExpresion && lastExpresion.length > 0) {
      nextSequence = lastExpresion[0].sequence + 1
    }
  }

  return (
    <>
      <div className="w-full py-6 px-4">
        <ExpresionForm
          comites={comites}
          temas={temas}
          clasificaciones={clasificaciones}
          currentYear={currentYear}
          nextSequence={nextSequence}
        />
      </div>
    </>
  )
}
