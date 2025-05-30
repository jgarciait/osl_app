import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AuthCodeErrorPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Error de autenticación</h1>
          <p className="text-sm text-muted-foreground">Hubo un problema al procesar su enlace de autenticación.</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Enlace inválido o expirado</AlertTitle>
          <AlertDescription>
            El enlace que utilizó no es válido o ha expirado. Por favor, solicite un nuevo enlace de restablecimiento de
            contraseña.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col space-y-2">
          <Button asChild>
            <Link href="/reset-password">Solicitar nuevo enlace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Volver al inicio de sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
