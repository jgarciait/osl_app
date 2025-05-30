"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, KeyRound } from "lucide-react"

// Define a type for the decoded token
interface DecodedResetToken {
  userId: string
  email: string
  timestamp: number
  purpose: string
}

function UpdatePasswordPageContents() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [resetToken, setResetToken] = useState<string | null>(null)
  const [decodedTokenInfo, setDecodedTokenInfo] = useState<DecodedResetToken | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("reset_token")
    setResetToken(token)

    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8")) as DecodedResetToken
        // Validate token structure and purpose
        if (decoded.userId && decoded.email && decoded.timestamp && decoded.purpose === "password_reset_access") {
          // Check timestamp (e.g., token valid for 1 hour)
          const oneHour = 60 * 60 * 1000
          if (Date.now() - decoded.timestamp > oneHour) {
            setTokenError("El enlace de restablecimiento de contraseña ha expirado.")
            setDecodedTokenInfo(null)
          } else {
            setDecodedTokenInfo(decoded)
            setTokenError(null)
            console.log("Decoded reset token:", decoded)
          }
        } else {
          throw new Error("Invalid token structure or purpose.")
        }
      } catch (e) {
        console.error("Error decoding reset token:", e)
        setTokenError("El enlace de restablecimiento de contraseña no es válido.")
        setDecodedTokenInfo(null)
      }
    } else {
      // If no reset_token, this page might be for a logged-in user changing their password.
      // For now, we'll assume it's primarily for the reset flow if token is expected.
      // You might add logic here to check if a user is already logged in for a normal password change.
      console.log("No reset_token found in URL. This page might be accessed directly.")
    }
  }, [searchParams])

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    // The Supabase session should already be established by the verifyOtp in the /auth/confirm route.
    // The custom reset_token was primarily to authorize access to this page.
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsLoading(false)
    if (error) {
      setMessage({ type: "error", text: `Error al actualizar la contraseña: ${error.message}` })
      console.error("Error updating password:", error)
    } else {
      setMessage({ type: "success", text: "Contraseña actualizada con éxito. Serás redirigido al inicio de sesión." })
      // Optionally sign out the user completely if verifyOtp created a very short-lived session
      // await supabase.auth.signOut();
      setTimeout(() => {
        router.push("/login") // Redirect to login page
      }, 3000)
    }
  }

  if (resetToken && tokenError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-500">{tokenError}</p>
            <Button onClick={() => router.push("/login")} className="w-full mt-4">
              Ir a Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (resetToken && !decodedTokenInfo && !tokenError) {
    // Still validating token or token was present but invalid without specific error yet
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <p>Verificando enlace...</p>
      </div>
    )
  }

  // Only show form if resetToken was present and successfully decoded
  if (!resetToken || !decodedTokenInfo) {
    // This case means either no token was provided, or it was invalid.
    // If you want this page to ALSO serve as a password change for already logged-in users,
    // you'd add a check here for an active Supabase session.
    // For now, focusing on the reset flow:
    if (resetToken === null && !searchParams.has("reset_token")) {
      // No token was ever in the URL, perhaps direct navigation.
      // You might redirect to login or show a message.
      // For now, let's assume if no token, it's an invalid access for reset.
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Acceso no Válido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">Este enlace no es válido o no tienes permiso para acceder a esta página.</p>
              <Button onClick={() => router.push("/login")} className="w-full mt-4">
                Ir a Inicio de Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    // If resetToken was present but decoding failed and tokenError is not yet set, show loading/error
    // This state should ideally be covered by the tokenError block above.
    // If we reach here with a resetToken but no decodedInfo, it's an issue.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <p>Error al procesar el enlace de restablecimiento.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-block mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Actualizar Contraseña</CardTitle>
          <CardDescription>
            Actualizando contraseña para:{" "}
            <span className="font-semibold">{decodedTokenInfo?.email || "tu cuenta"}</span>.
            <br />
            Ingresa tu nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="********"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="********"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {message.text}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Use Suspense to handle client-side data fetching (useSearchParams)
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <UpdatePasswordPageContents />
    </Suspense>
  )
}
