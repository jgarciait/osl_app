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

export function ComitesTable({ comites = [] }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  const [isDeleting, setIsDeleting] = useState(false)
  const [comiteToDelete, setComiteToDelete] = useState(null)

  const handleEdit = (comite) => {
    // Dispatch an event to update the form
    window.dispatchEvent(new CustomEvent("edit-comite", { detail: comite }))
  }

  const handleDelete = async () => {
    if (!comiteToDelete) return

    setIsDeleting(true)

    try {
      // Check if committee is used in any expression
      const { data: usedComites, error: checkError } = await supabase
        .from("expresion_comites")
        .select("comite_id")
        .eq("comite_id", comiteToDelete.id)
        .limit(1)

      if (checkError) throw checkError

      if (usedComites && usedComites.length > 0) {
        toast({
          variant: "destructive",
          title: "No se puede eliminar",
          description: "Este comité está siendo utilizado en una o más expresiones",
        })
        return
      }

      // Delete committee
      const { error } = await supabase.from("comites").delete().eq("id", comiteToDelete.id)

      if (error) throw error

      toast({
        title: "Comité eliminado",
        description: "El comité ha sido eliminado exitosamente",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting committee:", error)
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el comité",
      })
    } finally {
      setIsDeleting(false)
      setComiteToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No hay comités registrados
                </TableCell>
              </TableRow>
            ) : (
              comites.map((comite) => (
                <TableRow key={comite.id}>
                  <TableCell className="font-medium">{comite.nombre}</TableCell>
                  <TableCell>{comite.tipo === "senado" ? "Senado" : "Cámara"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(comite)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setComiteToDelete(comite)} className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!comiteToDelete} onOpenChange={() => setComiteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el comité
              {comiteToDelete?.nombre && ` "${comiteToDelete.nombre}"`}.
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

