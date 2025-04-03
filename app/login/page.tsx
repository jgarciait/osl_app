import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"

export default async function LoginPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard/expresiones")
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
          Sistema de Expresiones Legislativas
        </div>
        <div className="relative z-20 flex items-center justify-center pt-[50px] pb-[50px]">
          <Image
            src="/images/capitol.jpg"
            alt="Capitolio de Puerto Rico"
            width={600}
            height={300}
            className="rounded-lg shadow-lg m-0"
            priority
          />
        </div>
        <div className="relative z-20 mt-[30px]">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Este sistema permite a los funcionarios legislativos gestionar eficientemente las expresiones
              ciudadanas."
            </p>
            <footer className="text-sm">Administración Legislativa</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

