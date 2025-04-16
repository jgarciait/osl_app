import { createServerClient } from "@/lib/supabase-server"
import { ProfileForm } from "@/components/profile-form"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

async function getProfileData() {
  try {
    const supabase = await createServerClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("No session found")
      return { profile: null, user: null }
    }

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError)
    }

    return { profile, user: session.user }
  } catch (error) {
    console.error("Error in getProfileData:", error)
    return { profile: null, user: null }
  }
}

export default async function PerfilPage() {
  noStore()
  const { profile, user } = await getProfileData()

  if (!user) {
    notFound()
  }

  return (
    <>
      <div className="w-full py-6 px-4">
        <div className="space-y-6">
          <ProfileForm profile={profile} user={user} />
        </div>
      </div>
    </>
  )
}
