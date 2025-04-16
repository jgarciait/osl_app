import { ComitesTable } from "@/components/comites-table"
import { ComiteForm } from "@/components/comite-form"
import { safeSupabaseFetch } from "@/lib/supabase-helpers"

export default async function ComitesPage() {
  // Use safeSupabaseFetch to fetch comites
  const comites = await safeSupabaseFetch("comites", "*")

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ComiteForm />
            <ComitesTable comites={comites} />
          </div>
        </div>
      </div>
    </>
  )
}
