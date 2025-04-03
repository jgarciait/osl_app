import { createServerClient } from "@/lib/supabase-server"
import { ExpresionForm } from "@/components/expresion-form"

export default async function NuevaExpresionPage() {
  const supabase = createServerClient()

  // Fetch committees for the form
  const { data: comites } = await supabase.from("comites").select("*").order("nombre")

  // Get the current year and next sequence number
  const currentYear = new Date().getFullYear()

  const { data: lastExpresion } = await supabase
    .from("expresiones")
    .select("sequence")
    .eq("ano", currentYear)
    .order("sequence", { ascending: false })
    .limit(1)

  const nextSequence = lastExpresion && lastExpresion.length > 0 ? lastExpresion[0].sequence + 1 : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Expresión</h1>
        <p className="text-muted-foreground">Complete el formulario para registrar una nueva expresión ciudadana</p>
      </div>

      <ExpresionForm comites={comites || []} currentYear={currentYear} nextSequence={nextSequence} />
    </div>
  )
}

