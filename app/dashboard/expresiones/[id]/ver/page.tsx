import { createServerClient } from "@/lib/supabase-server"
import { OptimizedExpresionForm } from "@/components/optimized-expresion-form"
import { notFound } from "next/navigation"
import { OptimizedPermissionGuard } from "@/components/optimized-permission-guard"

export default async function VerExpresionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  // Single optimized query with all related data
  const { data: expresionData, error } = await supabase
    .from("view_expresiones_complete")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !expresionData) {
    notFound()
  }

  // Get all reference data in parallel
  const [{ data: comites }, { data: temas }, { data: clasificaciones }] = await Promise.all([
    supabase.from("comites").select("*").order("nombre"),
    supabase.from("temas").select("*").order("nombre"),
    supabase.from("clasificaciones").select("*").order("nombre"),
  ])

  return (
    <OptimizedPermissionGuard
      resource="expressions"
      action="view"
      fallback={<p>No tiene permiso para ver expresiones.</p>}
    >
      <div className="w-full py-6 px-4">
        <OptimizedExpresionForm
          expresion={expresionData}
          comites={comites || []}
          temas={temas || []}
          clasificaciones={clasificaciones || []}
          selectedComiteIds={expresionData.comite_ids || []}
          selectedClasificacionIds={expresionData.clasificacion_ids || []}
          isEditing={false}
          readOnly={true}
        />
      </div>
    </OptimizedPermissionGuard>
  )
}
