"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Upload, X } from "lucide-react"
import { generateExpressionNumber } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export function ExpresionForm({
  expresion,
  comites = [],
  selectedComiteIds = [],
  currentYear = new Date().getFullYear(),
  nextSequence = 1,
  isEditing = false,
}) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ano: expresion?.ano || currentYear,
    mes: expresion?.mes || new Date().getMonth() + 1,
    numero: expresion?.numero || generateExpressionNumber(currentYear, nextSequence),
    fecha_recibido: expresion?.fecha_recibido ? new Date(expresion.fecha_recibido) : new Date(),
    nombre: expresion?.nombre || "",
    email: expresion?.email || "",
    propuesta: expresion?.propuesta || "",
    tramite: expresion?.tramite || "",
    respuesta: expresion?.respuesta || "",
    notas: expresion?.notas || "",
    archivado: expresion?.archivado || false,
  })

  const [selectedComites, setSelectedComites] = useState(selectedComiteIds)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, fecha_recibido: date }))
  }

  const handleComitesChange = (values) => {
    setSelectedComites(values)
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleFileUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    try {
      const uploadedFileData = []

      for (const file of files) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `expresiones/${formData.ano}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("documentos").upload(filePath, file)

        if (uploadError) throw uploadError

        uploadedFileData.push({
          name: file.name,
          path: filePath,
          type: file.type,
          size: file.size,
        })
      }

      setUploadedFiles((prev) => [...prev, ...uploadedFileData])
      setFiles([])

      toast({
        title: "Archivos subidos",
        description: `${uploadedFileData.length} archivos subidos exitosamente`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        title: "Error al subir archivos",
        description: error.message || "Ocurrió un error al subir los archivos",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let expresionId = expresion?.id

      if (isEditing) {
        // Update existing expression
        const { error } = await supabase
          .from("expresiones")
          .update({
            ano: formData.ano,
            mes: formData.mes,
            fecha_recibido: formData.fecha_recibido,
            nombre: formData.nombre,
            email: formData.email,
            propuesta: formData.propuesta,
            tramite: formData.tramite,
            respuesta: formData.respuesta,
            notas: formData.notas,
            archivado: formData.archivado,
            updated_at: new Date(),
          })
          .eq("id", expresionId)

        if (error) throw error

        // Delete existing committee relationships
        const { error: deleteError } = await supabase.from("expresion_comites").delete().eq("expresion_id", expresionId)

        if (deleteError) throw deleteError
      } else {
        // Create new expression
        const { data, error } = await supabase
          .from("expresiones")
          .insert({
            ano: formData.ano,
            mes: formData.mes,
            numero: formData.numero,
            sequence: nextSequence,
            fecha_recibido: formData.fecha_recibido,
            nombre: formData.nombre,
            email: formData.email,
            propuesta: formData.propuesta,
            tramite: formData.tramite,
            respuesta: formData.respuesta,
            notas: formData.notas,
            archivado: formData.archivado,
          })
          .select()

        if (error) throw error

        expresionId = data[0].id
      }

      // Insert committee relationships
      if (selectedComites.length > 0) {
        const comiteRelations = selectedComites.map((comiteId) => ({
          expresion_id: expresionId,
          comite_id: comiteId,
        }))

        const { error: comitesError } = await supabase.from("expresion_comites").insert(comiteRelations)

        if (comitesError) throw comitesError
      }

      // Save uploaded file references
      if (uploadedFiles.length > 0) {
        const fileRecords = uploadedFiles.map((file) => ({
          expresion_id: expresionId,
          nombre: file.name,
          ruta: file.path,
          tipo: file.type,
          tamano: file.size,
        }))

        const { error: filesError } = await supabase.from("documentos").insert(fileRecords)

        if (filesError) throw filesError
      }

      toast({
        title: isEditing ? "Expresión actualizada" : "Expresión creada",
        description: isEditing
          ? "La expresión ha sido actualizada exitosamente"
          : "La expresión ha sido creada exitosamente",
      })

      router.push("/dashboard/expresiones")
      router.refresh()
    } catch (error) {
      console.error("Error saving expression:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "Ocurrió un error al guardar la expresión",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="tramite">Trámite y Respuesta</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Expresión</CardTitle>
              <CardDescription>Datos básicos de la expresión ciudadana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ano">Año</Label>
                  <Select
                    name="ano"
                    value={formData.ano.toString()}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ano: Number.parseInt(value) }))}
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione año" />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mes</Label>
                  <Select
                    name="mes"
                    value={formData.mes.toString()}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, mes: Number.parseInt(value) }))}
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" name="numero" value={formData.numero} onChange={handleInputChange} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_recibido">Fecha Recibido</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_recibido ? (
                        format(formData.fecha_recibido, "PPP", { locale: es })
                      ) : (
                        <span>Seleccione fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.fecha_recibido}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propuesta">Propuesta o Resumen</Label>
                <Textarea
                  id="propuesta"
                  name="propuesta"
                  value={formData.propuesta}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Referido a:</Label>
                <Card className="p-4">
                  <CheckboxGroup value={selectedComites} onValueChange={handleComitesChange}>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {comites.map((comite) => (
                        <CheckboxItem key={comite.id} id={`comite-${comite.id}`} value={comite.id}>
                          {comite.nombre} ({comite.tipo === "senado" ? "Senado" : "Cámara"})
                        </CheckboxItem>
                      ))}
                    </div>
                  </CheckboxGroup>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tramite">
          <Card>
            <CardHeader>
              <CardTitle>Trámite y Respuesta</CardTitle>
              <CardDescription>Información sobre el trámite y respuesta a la expresión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tramite">Trámite</Label>
                <Textarea id="tramite" name="tramite" value={formData.tramite} onChange={handleInputChange} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respuesta">Respuesta</Label>
                <Textarea
                  id="respuesta"
                  name="respuesta"
                  value={formData.respuesta}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" name="notas" value={formData.notas} onChange={handleInputChange} rows={3} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archivado"
                  checked={formData.archivado}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, archivado: checked }))}
                />
                <Label htmlFor="archivado">Archivar expresión</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Adjunte documentos relacionados con la expresión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-4">
                <Label htmlFor="files">Seleccionar archivos</Label>
                <Input id="files" type="file" multiple onChange={handleFileChange} disabled={uploading} />
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={files.length === 0 || uploading}
                  className="w-full md:w-auto"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir archivos
                    </>
                  )}
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Archivos adjuntos</Label>
                  <div className="rounded-md border">
                    <div className="divide-y">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2">
                          <div className="truncate">{file.name}</div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/expresiones")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[#1a365d] hover:bg-[#15294d]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Actualizando..." : "Guardando..."}
            </>
          ) : isEditing ? (
            "Actualizar"
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  )
}

