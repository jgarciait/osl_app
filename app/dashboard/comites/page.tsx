import { createServerClient } from "@/lib/supabase-server"
import { ComitesTable } from "@/components/comites-table"
import { ComiteForm } from "@/components/comite-form"

export default async function ComitesPage() {
  const supabase = await createServerClient()

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
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ComiteForm />
            <ComitesTable comites={Array.isArray(comites) ? comites : []} />
          </div>
        </div>
      </div>
    </>
  )
}
