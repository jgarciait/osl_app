"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientClient } from "@/lib/supabase-client"
import { KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [canUpdatePassword, setCanUpdatePassword] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!token_hash || type !== "recovery") {
          setError("Enlace inválido. Falta el token de recuperación.")
          setIsVerifying(false)
          return
        }

        console.log("Verifying token hash:", token_hash)

        // Verify the token hash with Supabase
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: "recovery",
        })

        if (verifyError) {
          console.error("Token verification failed:", verifyError)
          setError("El enlace de restablecimiento no es válido o ha expirado. Por favor, solicite uno nuevo.")
          setIsVerifying(false)
          return
        }

        console.log("Token verified successfully")
        setCanUpdatePassword(true)
        setError(null)
        setIsVerifying(false)
      } catch (err) {
        console.error("Error verifying token:", err)
        setError("Error al verificar el enlace. Por favor, inténtelo de nuevo.")
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [searchParams, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canUpdatePassword) {
      setError("No está autorizado para actualizar la contraseña.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(`Error al actualizar la contraseña: ${updateError.message}`)
      } else {
        setMessage("Su contraseña ha sido actualizada exitosamente. Será redirigido a la página de inicio de sesión.")

        // Sign out to force re-login with new password
        await supabase.auth.signOut()

        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (err) {
      console.error("Error updating password:", err)
      setError("Error inesperado al actualizar la contraseña. Por favor, inténtelo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando enlace...</p>
      </div>
    )
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Image src="/images/logo.png" alt="Logo" width={60} height={60} className="mr-4" />
          Sistema de Expresiones Legislativas
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Sistema para gestionar expresiones legislativas de ciudadanos de manera eficiente y transparente."
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <KeyRound className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Actualizar contraseña</h1>
            {canUpdatePassword && !message && (
              <p className="text-sm text-muted-foreground">Ingrese su nueva contraseña a continuación.</p>
            )}
          </div>

          {canUpdatePassword && !message && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 relative">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  placeholder="Mínimo 8 caracteres"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-6 h-7 px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres</p>
              </div>
              <div className="space-y-1 relative">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  placeholder="Confirme su contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-6 h-7 px-2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !!message}>
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {!canUpdatePassword && !isVerifying && (
            <div className="text-center">
              <Link href="/reset-password" className="text-sm text-primary hover:underline">
                Solicitar un nuevo enlace de restablecimiento
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
