import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs" // Changed import
import { cookies } from "next/headers" // Needed for createRouteHandlerClient
import type { EmailOtpType } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url) // Use origin for current app's domain
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") || "/account/update-password" // Default 'next' if not provided

  // Use the current application's origin as the appDomain, unless AppDomain is explicitly passed
  const appDomain = searchParams.get("AppDomain") || origin

  console.log(
    `[AQPlatform AuthConfirm] Request: token=${!!tokenHash}, type=${type}, next=${next}, appDomain=${appDomain}`,
  )

  if (!tokenHash || !type) {
    console.error("[AQPlatform AuthConfirm] Missing token_hash or type.")
    return NextResponse.redirect(new URL("/auth/auth-code-error?error=missing_parameters", appDomain))
  }

  if (type === "recovery") {
    try {
      const cookieStore = cookies()
      // Use createRouteHandlerClient for proper session cookie management
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
        console.error("[AQPlatform AuthConfirm] Supabase token verification failed:", otpError?.message)
        return NextResponse.redirect(new URL("/auth/auth-code-error?error=invalid_or_expired_token", appDomain))
      }

      // OTP verification successful, user session is established by verifyOtp.
      const tempTokenData = {
        userId: data.user.id,
        email: data.user.email,
        timestamp: Date.now(),
        purpose: "password_reset_access",
      }
      const customTempToken = Buffer.from(JSON.stringify(tempTokenData)).toString("base64")

      console.log("[AQPlatform AuthConfirm] Created custom temp token for user:", data.user.id)

      const redirectUrl = new URL(next, appDomain) // 'next' is like "/account/update-password"
      redirectUrl.searchParams.set("reset_token", customTempToken) // Using "reset_token" for clarity

      redirectUrl.searchParams.delete("token_hash") // Clean up Supabase params
      redirectUrl.searchParams.delete("type")
      redirectUrl.searchParams.delete("next")

      console.log(`[AQPlatform AuthConfirm] Redirecting to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error("[AQPlatform AuthConfirm] Unexpected error during recovery:", error)
      return NextResponse.redirect(new URL("/auth/auth-code-error?error=server_error", appDomain))
    }
  } else {
    console.warn(`[AQPlatform AuthConfirm] Unhandled OTP type: ${type}.`)
    return NextResponse.redirect(new URL(`/auth/auth-code-error?error=unsupported_otp_type&type=${type}`, appDomain))
  }
}
