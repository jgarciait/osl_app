import { createServerClient } from "@/lib/supabase-server"
import { ExpresionForm } from "@/components/expresion-form"
import { notFound } from "next/navigation"

export default async function EditarExpresionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  // Fetch expression data
  const { data: expresion, error } = await supabase
    .from("expresiones")
    .select(`
      *,
      expresion_comites(
        comite_id
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !expresion) {
    notFound()
  }

  // Fetch committees for the form
  const { data: comites } = await supabase.from("comites").select("*").order("nombre")

  // Extract committee IDs
  const comiteIds = expresion.expresion_comites.map((ec) => ec.comite_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Expresión</h1>
        <p className="text-muted-foreground">Actualice la información de la expresión ciudadana</p>
      </div>

      <ExpresionForm expresion={expresion} comites={comites || []} selectedComiteIds={comiteIds} isEditing={true} />
    </div>
  )
}

