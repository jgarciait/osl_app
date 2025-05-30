import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "El correo electrónico es requerido" }, { status: 400 })
    }

    // Use aqplatform.app as the redirect domain
    const redirectUrl = `https://aqplatform.app/reset-password/confirm`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un enlace de restablecimiento a su correo electrónico.",
    })
  } catch (error: any) {
    console.error("Error sending reset email:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
