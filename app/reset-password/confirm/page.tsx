"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const formSchema = z.object({
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
})

const ResetPasswordConfirmPage = () => {
  const [isVerifying, setIsVerifying] = useState(true)
  const [canUpdatePassword, setCanUpdatePassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  })

  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true)
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!token_hash || type !== "recovery") {
          setError("Enlace inválido. Falta el token de recuperación o el tipo es incorrecto.")
          setCanUpdatePassword(false)
          setIsVerifying(false)
          return
        }

        console.log("Verifying token hash:", token_hash, "type:", type)

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: "recovery",
        })

        if (verifyError) {
          console.error("Token verification failed:", verifyError)
          setError("El enlace de restablecimiento no es válido o ha expirado. Por favor, solicite uno nuevo.")
          setCanUpdatePassword(false)
        } else {
          console.log("Token verified successfully, session established.")
          setCanUpdatePassword(true)
          setError(null)

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()
          if (userError) {
            console.error("Error fetching user after token verification:", userError)
            // Optionally set an error or proceed without email
          } else if (user) {
            setUserEmail(user.email || null)
            console.log("User email fetched:", user.email)
          } else {
            console.log("No user found after token verification.")
          }
        }
      } catch (err) {
        console.error("Error during token verification process:", err)
        setError("Error al verificar el enlace. Por favor, inténtelo de nuevo.")
        setCanUpdatePassword(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [searchParams, supabase.auth])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const token_hash = searchParams.get("token_hash")

      if (!token_hash) {
        setError("Token hash is missing.")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        console.error("Password update failed:", error)
        setError("No se pudo actualizar la contraseña. Por favor, inténtelo de nuevo.")
        toast({
          title: "Error al actualizar la contraseña",
          description: "Por favor, inténtelo de nuevo.",
          variant: "destructive",
        })
      } else {
        setMessage("Contraseña actualizada con éxito. Redirigiendo...")
        toast({
          title: "Contraseña actualizada",
          description: "Su contraseña ha sido actualizada con éxito.",
        })

        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      console.error("Error during password update:", err)
      setError("Error al actualizar la contraseña. Por favor, inténtelo de nuevo.")
    }
  }

  return (
    <div className="container relative h-[500px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 1-6 0V6a3 3 0 1 1 6 0z" />
          </svg>
          Acme Corp
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Esta página le permite restablecer su contraseña de forma segura. Ingrese su nueva contraseña y
              siga las instrucciones para recuperar el acceso a su cuenta.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Actualizar contraseña</h1>
            {canUpdatePassword && !message && userEmail && (
              <p className="text-sm text-muted-foreground">
                Actualizando contraseña para: <span className="font-medium">{userEmail}</span>
              </p>
            )}
            {canUpdatePassword && !message && !userEmail && (
              <p className="text-sm text-muted-foreground">Ingrese su nueva contraseña a continuación.</p>
            )}
          </div>
          {isVerifying ? (
            <div className="text-center">Verificando enlace...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : message ? (
            <div className="text-center text-green-500">{message}</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Actualizar contraseña</Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordConfirmPage
