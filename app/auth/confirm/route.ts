import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic" // Ensures the route is not statically cached

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/" // Default next path for non-recovery flows

  // If it's a recovery token, redirect to the dedicated password reset confirmation page
  if (token_hash && type === "recovery") {
    const recoveryRedirectUrl = new URL("/reset-password/confirm", request.nextUrl.origin)
    recoveryRedirectUrl.searchParams.set("token_hash", token_hash)
    recoveryRedirectUrl.searchParams.set("type", type)
    // The 'next' param from the original link is not needed for /reset-password/confirm,
    // as that page handles its own navigation after a successful password update.
    return NextResponse.redirect(recoveryRedirectUrl)
  }

  // For other OTP types (like email change, magic link, signup confirmation)
  if (token_hash && type) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Successfully verified OTP for non-recovery type, redirect to the 'next' URL
      const redirectTo = request.nextUrl.clone()
      redirectTo.pathname = next
      redirectTo.searchParams.delete("token_hash")
      redirectTo.searchParams.delete("type")
      redirectTo.searchParams.delete("next") // Clean up all auth params
      return NextResponse.redirect(redirectTo)
    } else {
      console.error("Supabase verifyOtp error for non-recovery:", error.message)
    }
  }

  // If token_hash or type is missing, or if verifyOtp failed for non-recovery types,
  // or if it's a recovery attempt that somehow missed the first 'if' block.
  const errorRedirectUrl = new URL("/auth/auth-code-error", request.nextUrl.origin)
  errorRedirectUrl.searchParams.set("error_description", "Invalid or expired confirmation link.")
  if (type) {
    errorRedirectUrl.searchParams.set("type", type)
  }
  if (token_hash) {
    errorRedirectUrl.searchParams.set("has_token", "true")
  }
  return NextResponse.redirect(errorRedirectUrl)
}
