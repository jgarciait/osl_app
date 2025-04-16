"use client"

import { useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Edit, MoreHorizontal, Trash } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useGroupPermissions } from "@/hooks/use-group-permissions"

interface EtiquetasTableProps {
  etiquetas: any[]
}

export function EtiquetasTable({ etiquetas }: EtiquetasTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()
  const { hasPermission } = useGroupPermissions()
  const canManageEtiquetas = hasPermission("etiquetas", "manage")

  const [isDeleting, setIsDeleting] = useState(false)
  const [etiquetaToDelete, setEtiquetaToDelete] = useState(null)

  const handleEdit = (etiqueta) => {
    // Dispatch an event to update the form
    window.dispatchEvent(new CustomEvent("edit-etiqueta", { detail: etiqueta }))
  }

  const handleDelete = async () => {
    if (!etiquetaToDelete) return

    setIsDeleting(true)

    try {
      // Check if etiqueta is used in any expression
      const { data: usedEtiquetas, error: checkError } = await supabase
        .from("documento_etiquetas")
        .select("etiqueta_id")
        .eq("etiqueta_id", etiquetaToDelete.id)
        .limit(1)

      if (checkError) throw checkError

      if (usedEtiquetas && usedEtiquetas.length > 0) {
        toast({
          variant: "destructive",
          title: "No se puede eliminar",
          description: "Esta etiqueta está siendo utilizada en uno o más documentos",
        })
        return
      }

      // Delete etiqueta
      const { error } = await supabase.from("etiquetas").delete().eq("id", etiquetaToDelete.id)

      if (error) throw error

      toast({
        title: "Etiqueta eliminada",
        description: "La etiqueta ha sido eliminada exitosamente",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting etiqueta:", error)
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar la etiqueta",
      })
    } finally {
      setIsDeleting(false)
      setEtiquetaToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              {canManageEtiquetas && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {etiquetas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No hay etiquetas registradas
                </TableCell>
              </TableRow>
            ) : (
              etiquetas.map((etiqueta) => (
                <TableRow key={etiqueta.id}>
                  <TableCell className="font-medium">{etiqueta.nombre}</TableCell>
                  <TableCell>{etiqueta.descripcion || "-"}</TableCell>
                  {canManageEtiquetas && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(etiqueta)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEtiquetaToDelete(etiqueta)} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!etiquetaToDelete} onOpenChange={() => setEtiquetaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la etiqueta
              {etiquetaToDelete?.nombre && ` "${etiquetaToDelete.nombre}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
