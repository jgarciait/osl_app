import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { WelcomeDashboard } from "@/components/welcome-dashboard"

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("nombre").eq("id", session.user.id).single()

  const userName = profile?.nombre || ""

  return <WelcomeDashboard userName={userName} />
}

