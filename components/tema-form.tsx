"use client"

import { CardFooter } from "@/components/ui/card"

import { useEffect } from "react"

import { useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Tema {
  id: number | null
  nombre: string
  abreviatura: string
}

export function TemaForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Tema>({
    id: null,
    nombre: "",
    abreviatura: "",
  })

  useEffect(() => {
    // Listen for edit events
    const handleEditTema = (event: CustomEvent<Tema>) => {
      const tema = event.detail
      setFormData({
        id: tema.id,
        nombre: tema.nombre,
        abreviatura: tema.abreviatura || "",
      })
    }

    window.addEventListener("edit-tema", handleEditTema as EventListener)

    return () => {
      window.removeEventListener("edit-tema", handleEditTema as EventListener)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formData.id) {
        // Update existing tema
        const { error } = await supabase
          .from("temas")
          .update({
            nombre: formData.nombre,
            abreviatura: formData.abreviatura,
          })
          .eq("id", formData.id)

        if (error) throw error

        toast({
          title: "Tema actualizado",
          description: "El tema ha sido actualizado exitosamente",
        })

        // Dispatch event for table update
        window.dispatchEvent(new CustomEvent("tema-updated", { detail: formData }))
      } else {
        // Create new tema
        const { error } = await supabase.from("temas").insert({
          nombre: formData.nombre,
          abreviatura: formData.abreviatura,
        })

        if (error) throw error

        toast({
          title: "Tema creado",
          description: "El tema ha sido creado exitosamente",
        })

        // Dispatch event for table update
        window.dispatchEvent(new CustomEvent("tema-created", { detail: formData }))
      }

      // Reset form
      setFormData({
        id: null,
        nombre: "",
        abreviatura: "",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Error saving tema:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "Ocurrió un error al guardar el tema",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      id: null,
      nombre: "",
      abreviatura: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {formData.id ? "Actualice la información del tema" : "Complete el formulario para añadir un nuevo tema."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abreviatura">Abreviatura</Label>
            <Input id="abreviatura" name="abreviatura" value={formData.abreviatura} onChange={handleInputChange} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {formData.id && (
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`${formData.id ? "" : "w-full"} bg-[#1a365d] hover:bg-[#15294d]`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {formData.id ? "Actualizando..." : "Guardando..."}
              </>
            ) : formData.id ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
