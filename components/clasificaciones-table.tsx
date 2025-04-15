"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ClasificacionForm } from "@/components/clasificacion-form"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { createClientClient } from "@/lib/supabase-client"
import { Pencil, Trash2, Plus } from "lucide-react"

interface Clasificacion {
  id: string
  nombre: string
  descripcion?: string
  created_at: string
}

export function ClasificacionesTable() {
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClasificacion, setSelectedClasificacion] = useState<Clasificacion | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClientClient()

  // Cargar clasificaciones
  const fetchClasificaciones = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("clasificaciones").select("*").order("nombre")

      if (error) throw error

      setClasificaciones(data || [])
    } catch (error: any) {
      console.error("Error al cargar clasificaciones:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las clasificaciones",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClasificaciones()
  }, [])

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedClasificacion) return

    try {
      const { error } = await supabase.from("clasificaciones").delete().eq("id", selectedClasificacion.id)

      if (error) throw error

      toast({
        title: "Clasificación eliminada",
        description: "La clasificación ha sido eliminada exitosamente",
      })

      // Actualizar la lista
      fetchClasificaciones()
    } catch (error: any) {
      console.error("Error al eliminar clasificación:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar la clasificación",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedClasificacion(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Clasificaciones</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Clasificación</DialogTitle>
              <DialogDescription>Crea una nueva clasificación para las expresiones.</DialogDescription>
            </DialogHeader>
            <ClasificacionForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                fetchClasificaciones()
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Cargando clasificaciones...</div>
        ) : clasificaciones.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No hay clasificaciones disponibles</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clasificaciones.map((clasificacion) => (
                <TableRow key={clasificacion.id}>
                  <TableCell className="font-medium">{clasificacion.nombre}</TableCell>
                  <TableCell>{clasificacion.descripcion || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedClasificacion(clasificacion)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedClasificacion(clasificacion)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Clasificación</DialogTitle>
              <DialogDescription>Actualiza los detalles de la clasificación.</DialogDescription>
            </DialogHeader>
            {selectedClasificacion && (
              <ClasificacionForm
                clasificacion={selectedClasificacion}
                onSuccess={() => {
                  setIsEditDialogOpen(false)
                  fetchClasificaciones()
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Eliminar Clasificación"
          description={`¿Estás seguro de que deseas eliminar la clasificación "${selectedClasificacion?.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  )
}
