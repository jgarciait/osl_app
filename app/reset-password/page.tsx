"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientClient } from "@/lib/supabase-client"
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClientClient()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Suppress ResizeObserver errors for this component
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://aqplatform.app/reset-password/confirm",
      })

      if (resetError) {
        console.error("Reset password error:", resetError)
        setError(`Error al enviar el correo: ${resetError.message}`)
      } else {
        setMessage(
          "Se ha enviado un enlace de restablecimiento a su correo electrónico. Por favor, revise su bandeja de entrada y siga las instrucciones.",
        )
      }
    } catch (err) {
      console.error("Error sending reset email:", err)
      setError("Error inesperado al enviar el correo. Por favor, inténtelo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#1a365d]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Image
            src="/images/logo.png"
            alt="Logo Oficina de Servicios Legislativos"
            width={80}
            height={80}
            className="mr-4"
          />
          Sistema de Expresiones Ciudadanas
        </div>
        <div className="relative z-20 w-full pt-[50px] pb-[50px]">
          <Image
            src="/images/capitol.jpg"
            alt="Capitolio de Puerto Rico"
            width={1200}
            height={300}
            className="w-full h-[300px] object-cover rounded-lg shadow-lg"
            priority
          />
        </div>
        <div className="relative z-20 mt-[30px]">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Este sistema permite gestionar las expresiones ciudadanas y facilitar la integración de los ciudadanos en
              los procesos legislativos."
            </p>
            <footer className="text-sm">Oficina de Participación Ciudadana</footer>
          </blockquote>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Restablecer contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.
            </p>
          </div>

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar enlace de restablecimiento"}
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
              <AlertTitle>Correo enviado</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
