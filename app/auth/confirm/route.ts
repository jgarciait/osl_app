import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { EmailOtpType } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") // Will be "/account/update-password" from your link

  console.log(
    `[AQPlatform AuthConfirm] START - Path: /auth/confirm, Token: ${!!tokenHash}, Type: ${type}, Next: ${next}`,
  )

  if (!tokenHash || !type) {
    console.error("[AQPlatform AuthConfirm] FAIL - Missing token_hash or type.")
    return NextResponse.redirect(new URL("/auth/auth-code-error?error=missing_parameters", origin))
  }

  if (type === "recovery") {
    if (!next) {
      console.error("[AQPlatform AuthConfirm] FAIL - 'next' parameter is missing for recovery type.")
      return NextResponse.redirect(new URL("/auth/auth-code-error?error=missing_next_param", origin))
    }

    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

      const { data, error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      })

      console.log("[AQPlatform AuthConfirm] Supabase verifyOtp result:", {
        success: !!data?.user,
        error: otpError?.message,
        userId: data?.user?.id,
      })

      if (otpError || !data?.user) {
        console.error("[AQPlatform AuthConfirm] FAIL - Supabase token verification failed:", otpError?.message)
        return NextResponse.redirect(new URL("/auth/auth-code-error?error=invalid_or_expired_token", origin))
      }

      // OTP verification successful, user session is established by verifyOtp.
      // Create a custom temporary token.
      const tempTokenData = {
        userId: data.user.id,
        email: data.user.email,
        timestamp: Date.now(),
        purpose: "password_reset_access", // Specific purpose
      }
      // Use a more URL-friendly name for the token if needed, e.g., "reset_session_token"
      const customTempToken = Buffer.from(JSON.stringify(tempTokenData)).toString("base64")

      console.log("[AQPlatform AuthConfirm] SUCCESS - Created custom temp token for user:", data.user.id)

      // Redirect to the 'next' page (e.g., /account/update-password)
      // with the custom temporary token.
      const redirectUrl = new URL(next, origin) // 'next' is like "/account/update-password"
      redirectUrl.searchParams.set("reset_token", customTempToken) // Pass the custom token

      // Clean up Supabase OTP params from the redirect URL as they are no longer needed
      redirectUrl.searchParams.delete("token_hash")
      redirectUrl.searchParams.delete("type")
      // Also remove 'next' if it was part of the original 'next' value, though unlikely here
      redirectUrl.searchParams.delete("next")

      console.log(`[AQPlatform AuthConfirm] Redirecting to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error("[AQPlatform AuthConfirm] FAIL - Unexpected error during recovery:", error)
      return NextResponse.redirect(new URL("/auth/auth-code-error?error=server_error", origin))
    }
  } else {
    // Handle other OTP types if necessary (e.g., email confirmation, magic link)
    console.warn(`[AQPlatform AuthConfirm] Unhandled OTP type: ${type}. Redirecting to error page.`)
    return NextResponse.redirect(new URL(`/auth/auth-code-error?error=unsupported_otp_type&type=${type}`, origin))
  }
}
