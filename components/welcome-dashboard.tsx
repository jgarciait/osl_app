import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function WelcomeDashboard({ userName = "" }) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl">
            {userName ? `Bienvenido, ${userName}` : "Bienvenido al Sistema de Expresiones Legislativas"}
          </CardTitle>
          <CardDescription>
            Sistema para la gestión de expresiones ciudadanas de la Oficina de Servicios Legislativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-6">
            <Image
              src="/images/capitol.jpg"
              alt="Capitolio de Puerto Rico"
              width={1000}
              height={500}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Expresiones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestione las expresiones ciudadanas, incluyendo su registro, seguimiento y respuesta.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administre las comisiones del Senado y la Cámara de Representantes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Adjunte y gestione documentos relacionados con las expresiones ciudadanas.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

