"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientClient } from "@/lib/supabase-client"
import { toast } from "sonner" // Asumiendo que estás usando sonner para los toasts
import Link from "next/link"

export function LoginForm({ isLoggedIn = false }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createClientClient())

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Iniciar sesión con email y password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      // Check if user is active in profile table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        console.error("Error al verificar perfil de usuario:", profileError)
        setError("Error al verificar el estado del usuario. Por favor, contacta al administrador.")
        setIsLoading(false)
        return
      }

      if (!profileData?.active) {
        // User is not active, sign them out and show error
        await supabase.auth.signOut()
        setError(
          "Tu cuenta está desactivada. Por favor, contacta al administrador del sistema para reactivar tu cuenta.",
        )
        setIsLoading(false)
        return
      }

      // Verificar si el usuario pertenece al departamento con id=1
      if (authData.user) {
        const { data: belongsToDept, error: deptError } = await supabase.rpc("user_belongs_to_department", {
          p_user_id: authData.user.id,
          p_department_id: 1,
        })

        if (deptError) {
          console.error("Error al verificar departamento:", deptError)
          // Continuar con el login a pesar del error en la verificación
        } else if (!belongsToDept) {
          // El usuario no pertenece al departamento requerido
          await supabase.auth.signOut() // Cerrar la sesión que acabamos de abrir
          setError(
            "No estás autorizado para usar esta aplicación. Tu usuario no pertenece al departamento requerido. Por favor, contacta al administrador del sistema para solicitar acceso.",
          )
          setIsLoading(false)
          return
        }
      }

      // Si todo está bien, redirigir al dashboard
      toast.success("Inicio de sesión exitoso", {
        description: "Bienvenido al sistema",
      })
      router.push("/dashboard")
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión. Por favor, inténtelo de nuevo.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              placeholder="nombre@ejemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              placeholder="********"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>
        </div>
      </form>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
