"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedPermissionGuard } from "@/components/optimized-permission-guard"

type ExpresionData = {
  id: string
  numero: string
  titulo: string
  contenido: string
  estado: string
  created_at: string
  expresion_comites: Array<{
    comite_id: string
    comites: {
      id: string
      nombre: string
      descripcion: string
    }
  }>
  expresion_temas: Array<{
    tema_id: string
    temas: {
      id: string
      nombre: string
      descripcion: string
    }
  }>
  expresion_clasificaciones: Array<{
    clasificacion_id: string
    clasificaciones: {
      id: string
      nombre: string
      descripcion: string
    }
  }>
  expresion_etiquetas: Array<{
    etiqueta_id: string
    etiquetas: {
      id: string
      nombre: string
      color: string
    }
  }>
  documentos: Array<{
    id: string
    nombre: string
    url: string
    tipo: string
    tamaño: number
    created_at: string
  }>
  profiles: {
    id: string
    email: string
    nombre_completo: string
  }
}

type OptimizedExpresionViewProps = {
  expresion: ExpresionData
}

// Memoized sub-components
const ExpresionHeader = memo(function ExpresionHeader({
  numero,
  titulo,
  estado,
}: {
  numero: string
  titulo: string
  estado: string
}) {
  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl">{titulo}</CardTitle>
          <p className="text-muted-foreground">Expresión #{numero}</p>
        </div>
        <Badge variant={estado === "activa" ? "default" : "secondary"}>{estado}</Badge>
      </div>
    </CardHeader>
  )
})

const ExpresionContent = memo(function ExpresionContent({
  contenido,
}: {
  contenido: string
}) {
  return (
    <CardContent>
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: contenido }} />
      </div>
    </CardContent>
  )
})

const ExpresionMetadata = memo(function ExpresionMetadata({
  comites,
  temas,
  clasificaciones,
  etiquetas,
}: {
  comites: ExpresionData["expresion_comites"]
  temas: ExpresionData["expresion_temas"]
  clasificaciones: ExpresionData["expresion_clasificaciones"]
  etiquetas: ExpresionData["expresion_etiquetas"]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadatos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comites.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Comités</h4>
            <div className="flex flex-wrap gap-2">
              {comites.map((item) => (
                <Badge key={item.comite_id} variant="outline">
                  {item.comites.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {temas.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Temas</h4>
            <div className="flex flex-wrap gap-2">
              {temas.map((item) => (
                <Badge key={item.tema_id} variant="outline">
                  {item.temas.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {clasificaciones.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Clasificaciones</h4>
            <div className="flex flex-wrap gap-2">
              {clasificaciones.map((item) => (
                <Badge key={item.clasificacion_id} variant="outline">
                  {item.clasificaciones.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {etiquetas.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Etiquetas</h4>
            <div className="flex flex-wrap gap-2">
              {etiquetas.map((item) => (
                <Badge key={item.etiqueta_id} style={{ backgroundColor: item.etiquetas.color }} className="text-white">
                  {item.etiquetas.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

const ExpresionDocuments = memo(function ExpresionDocuments({
  documentos,
}: {
  documentos: ExpresionData["documentos"]
}) {
  if (documentos.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Adjuntos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{doc.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.tipo} • {(doc.tamaño / 1024).toFixed(1)} KB
                </p>
              </div>
              <OptimizedPermissionGuard resource="documentos" action="download">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Descargar
                </a>
              </OptimizedPermissionGuard>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

export const OptimizedExpresionView = memo(function OptimizedExpresionView({ expresion }: OptimizedExpresionViewProps) {
  // Memoize computed values
  const memoizedData = useMemo(
    () => ({
      header: {
        numero: expresion.numero,
        titulo: expresion.titulo,
        estado: expresion.estado,
      },
      content: expresion.contenido,
      metadata: {
        comites: expresion.expresion_comites,
        temas: expresion.expresion_temas,
        clasificaciones: expresion.expresion_clasificaciones,
        etiquetas: expresion.expresion_etiquetas,
      },
      documentos: expresion.documentos,
    }),
    [expresion],
  )

  return (
    <div className="space-y-6">
      <Card>
        <ExpresionHeader {...memoizedData.header} />
        <ExpresionContent contenido={memoizedData.content} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpresionMetadata {...memoizedData.metadata} />
        <ExpresionDocuments documentos={memoizedData.documentos} />
      </div>
    </div>
  )
})
