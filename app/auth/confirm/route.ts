import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Suggest to Vercel that this route should be dynamic
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  console.log(`[AQPlatform Auth Confirm] Request for /auth/confirm. Token: ${!!token_hash}, Type: ${type}`)

  // For password recovery, we'll verify the OTP here to establish a session,
  // then redirect to the page that shows the password update form.
  if (token_hash && type === "recovery") {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash,
    })

    if (otpError) {
      console.error("[AQPlatform Auth Confirm] Recovery OTP verification failed:", otpError.message)
      const errorPageUrl = new URL("/auth/auth-code-error", origin)
      errorPageUrl.searchParams.set("error", "invalid_link")
      errorPageUrl.searchParams.set("message", "Password reset link is invalid or has expired.")
      return NextResponse.redirect(errorPageUrl)
    }

    // OTP verified successfully, session is established.
    // Redirect to the page where the user can enter their new password.
    // This page will use the established session to authorize the password update.
    const resetPasswordPageUrl = new URL("/reset-password/confirm", origin)
    // Pass original params for clarity or if the page wants to re-verify, though session is key
    resetPasswordPageUrl.searchParams.set("token_hash", token_hash)
    resetPasswordPageUrl.searchParams.set("type", type)
    console.log(`[AQPlatform Auth Confirm] Recovery OTP success. Redirecting to: ${resetPasswordPageUrl.toString()}`)
    return NextResponse.redirect(resetPasswordPageUrl)
  }

  // Handle other OTP types if necessary (e.g., email change, magic link)
  if (token_hash && type) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { error: otherOtpError } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!otherOtpError) {
      const next = searchParams.get("next") ?? "/"
      console.log(`[AQPlatform Auth Confirm] Other OTP type '${type}' success. Redirecting to: ${next}`)
      return NextResponse.redirect(new URL(next, origin))
    } else {
      console.error(`[AQPlatform Auth Confirm] Other OTP type '${type}' verification failed:`, otherOtpError.message)
    }
  }

  // Fallback for missing parameters or unhandled types/errors
  console.log("[AQPlatform Auth Confirm] Invalid parameters or unhandled case. Redirecting to error page.")
  const defaultErrorUrl = new URL("/auth/auth-code-error", origin)
  defaultErrorUrl.searchParams.set("error", "invalid_request")
  return NextResponse.redirect(defaultErrorUrl)
}
