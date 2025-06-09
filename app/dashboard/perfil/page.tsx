import { createServerClient } from "@/lib/supabase-server"
import { ProfileForm } from "@/components/profile-form"
import { notFound } from "next/navigation"

export default async function PerfilPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    notFound()
  }

  // Fetch user profile data
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error)
  }

  return (
    <div className="w-full py-6 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestione su información personal y configuración de seguridad</p>
        </div>
        <ProfileForm profile={profile} user={session.user} />
      </div>
    </div>
  )
}
