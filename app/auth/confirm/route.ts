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
  const next = searchParams.get("next") ?? "/" // Default next path

  console.log(`[Auth Confirm Route] Received request: token_hash=${token_hash}, type=${type}, next=${next}`)

  if (token_hash && type === "recovery") {
    const recoveryRedirectUrl = new URL("/reset-password/confirm", origin)
    recoveryRedirectUrl.searchParams.set("token_hash", token_hash)
    recoveryRedirectUrl.searchParams.set("type", type)
    console.log(`[Auth Confirm Route] Redirecting for recovery to: ${recoveryRedirectUrl.toString()}`)
    return NextResponse.redirect(recoveryRedirectUrl)
  }

  if (token_hash && type) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      console.log(`[Auth Confirm Route] OTP verified successfully for type: ${type}. Redirecting to: ${next}`)
      const redirectTo = new URL(next, origin)
      // Clean up auth params from the redirect URL if they were part of 'next'
      redirectTo.searchParams.delete("token_hash")
      redirectTo.searchParams.delete("type")
      return NextResponse.redirect(redirectTo)
    } else {
      console.error(`[Auth Confirm Route] Supabase verifyOtp error for type ${type}:`, error.message)
    }
  }

  console.log("[Auth Confirm Route] Parameters invalid or OTP verification failed. Redirecting to error page.")
  const errorRedirectUrl = new URL("/auth/auth-code-error", origin)
  errorRedirectUrl.searchParams.set("error_description", "Invalid or expired confirmation link.")
  if (type) errorRedirectUrl.searchParams.set("type", type)
  return NextResponse.redirect(errorRedirectUrl)
}
