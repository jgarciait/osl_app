import { createServerClient } from "@/lib/supabase-server"
import { TemasTable } from "@/components/temas-table"
import { TemaForm } from "@/components/tema-form"

export default async function TemasPage() {
  const supabase = createServerClient()

  // Fetch temas
  const { data: temas, error } = await supabase.from("temas").select("*").order("nombre", { ascending: true })

  if (error) {
    console.error("Error fetching temas:", error)
  }

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">Administre los temas para clasificar las expresiones ciudadanas</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TemaForm />
            <TemasTable temas={temas || []} />
          </div>
        </div>
      </div>
    </>
  )
}
