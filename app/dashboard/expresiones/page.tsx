"use client"

import { useState, useEffect, useRef } from "react"
import { createClientClient, cachedQuery } from "@/lib/supabase-client"
import { ExpresionesTable } from "@/components/expresiones-table"
import { useToast } from "@/components/ui/use-toast"

export default function ExpresionesPage() {
  const [expresiones, setExpresiones] = useState([])
  const [years, setYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientClient()
  const { toast } = useToast()

  // Añadir refs para las suscripciones
  const subscriptions = useRef([])

  // Función para limpiar suscripciones
  const cleanupSubscriptions = () => {
    subscriptions.current.forEach((subscription) => subscription.unsubscribe())
    subscriptions.current = []
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener los perfiles de usuarios con caché
        const profiles = await cachedQuery("profiles", () => supabase.from("profiles").select("id, nombre, apellido"))

        // Obtener los temas con caché
        const temas = await cachedQuery("temas", () => supabase.from("temas").select("id, nombre"))

        // Crear un mapa de IDs de usuario a nombres completos
        const userMap = new Map()
        profiles?.data?.forEach((profile) => {
          userMap.set(profile.id, `${profile.nombre} ${profile.apellido}`)
        })

        // Obtener las expresiones con su campo tema
        const { data, error } = await supabase
          .from("expresiones")
          .select(`
            id, 
            nombre, 
            email, 
            numero, 
            ano, 
            mes, 
            archivado, 
            created_at,
            assigned_to,
            assigned_color,
            assigned_text_color,
            assigned_border_color,
            tema
          `)
          .order("created_at", { ascending: false })
          .limit(50) // Añadir un límite para evitar cargar demasiados datos

        if (error) {
          console.error("Error al obtener expresiones:", error)
          throw error
        }

        // Obtener las relaciones entre expresiones y temas
        const { data: expresionTemas, error: expresionTemasError } = await supabase
          .from("expresion_temas")
          .select("expresion_id, tema_id")

        if (expresionTemasError) {
          console.error("Error al obtener relaciones expresion-tema:", expresionTemasError)
          // Continuamos aunque haya error, ya que podemos usar el campo tema directo
        }

        // Crear un mapa de expresión a temas
        const expresionTemasMap = new Map()
        if (expresionTemas) {
          expresionTemas.forEach((rel) => {
            if (!expresionTemasMap.has(rel.expresion_id)) {
              expresionTemasMap.set(rel.expresion_id, [])
            }
            expresionTemasMap.get(rel.expresion_id).push(rel.tema_id)
          })
        }

        // Crear un mapa de IDs de tema a nombres
        const temasMap = new Map()
        temas?.data?.forEach((tema) => {
          temasMap.set(tema.id, tema.nombre)
        })

        // Procesar los datos para incluir el nombre del tema y el nombre del usuario asignado
        const processedData = data.map((expresion) => {
          // Primero intentamos obtener el tema de la relación muchos a muchos
          let tema_nombre = "Sin asignar"

          // Si hay relaciones en expresion_temas, usamos el primer tema relacionado
          const temasRelacionados = expresionTemasMap.get(expresion.id)
          if (temasRelacionados && temasRelacionados.length > 0) {
            const primerTemaId = temasRelacionados[0]
            tema_nombre = temasMap.get(primerTemaId) || "Sin asignar"
          }
          // Si no hay relación, intentamos usar el campo tema directo
          else if (expresion.tema) {
            tema_nombre = temasMap.get(expresion.tema) || "Sin asignar"
          }

          // Obtener el nombre del usuario asignado si existe
          const assigned_to_name = expresion.assigned_to ? userMap.get(expresion.assigned_to) || null : null

          return {
            ...expresion,
            tema_nombre,
            assigned_to_name,
          }
        })

        setExpresiones(processedData)

        // Obtener años únicos para el filtro
        const uniqueYears = [...new Set(data.map((item) => item.ano))].sort((a, b) => b - a)
        setYears(uniqueYears)

        // Configurar suscripciones en tiempo real
        setupRealtimeSubscriptions(userMap, temasMap, expresionTemasMap)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las expresiones. Por favor, intente nuevamente.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Limpiar suscripciones al desmontar
    return () => {
      cleanupSubscriptions()
    }
  }, [supabase, toast])

  // Función para configurar suscripciones en tiempo real
  const setupRealtimeSubscriptions = (userMap, temasMap, expresionTemasMap) => {
    // Limpiar suscripciones existentes
    cleanupSubscriptions()

    // Suscribirse a cambios en expresiones
    const expresionesSubscription = supabase
      .channel("expresiones-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expresiones",
        },
        (payload) => {
          console.log("Cambio en expresiones:", payload)

          if (payload.eventType === "INSERT") {
            // Procesar nueva expresión
            const newExpresion = payload.new

            // Obtener el nombre del tema
            let tema_nombre = "Sin asignar"
            if (newExpresion.tema) {
              tema_nombre = temasMap.get(newExpresion.tema) || "Sin asignar"
            }

            // Obtener el nombre del usuario asignado
            const assigned_to_name = newExpresion.assigned_to ? userMap.get(newExpresion.assigned_to) || null : null

            // Añadir la nueva expresión al estado
            setExpresiones((prev) => [
              {
                ...newExpresion,
                tema_nombre,
                assigned_to_name,
              },
              ...prev,
            ])
          } else if (payload.eventType === "UPDATE") {
            // Actualizar expresión existente
            setExpresiones((prev) =>
              prev.map((exp) => {
                if (exp.id === payload.new.id) {
                  // Obtener el nombre del tema
                  let tema_nombre = "Sin asignar"
                  if (payload.new.tema) {
                    tema_nombre = temasMap.get(payload.new.tema) || "Sin asignar"
                  }

                  // Obtener el nombre del usuario asignado
                  const assigned_to_name = payload.new.assigned_to ? userMap.get(payload.new.assigned_to) || null : null

                  return {
                    ...payload.new,
                    tema_nombre,
                    assigned_to_name,
                  }
                }
                return exp
              }),
            )
          } else if (payload.eventType === "DELETE") {
            // Eliminar expresión
            setExpresiones((prev) => prev.filter((exp) => exp.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Suscribirse a cambios en expresion_comites
    const expresionComitesSubscription = supabase
      .channel("expresion-comites-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expresion_comites",
        },
        (payload) => {
          console.log("Cambio en expresion_comites:", payload)
          // Aquí podrías implementar lógica específica para actualizar las relaciones
          // entre expresiones y comités si es necesario
        },
      )
      .subscribe()

    // Suscribirse a cambios en expresion_clasificaciones
    const expresionClasificacionesSubscription = supabase
      .channel("expresion-clasificaciones-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expresion_clasificaciones",
        },
        (payload) => {
          console.log("Cambio en expresion_clasificaciones:", payload)
          // Aquí podrías implementar lógica específica para actualizar las relaciones
          // entre expresiones y clasificaciones si es necesario
        },
      )
      .subscribe()

    // Suscribirse a cambios en documentos
    const documentosSubscription = supabase
      .channel("documentos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documentos",
        },
        (payload) => {
          console.log("Cambio en documentos:", payload)
          // Aquí podrías implementar lógica específica para actualizar los documentos
          // si es necesario en esta vista
        },
      )
      .subscribe()

    // Guardar referencias a las suscripciones para limpiarlas después
    subscriptions.current = [
      expresionesSubscription,
      expresionComitesSubscription,
      expresionClasificacionesSubscription,
      documentosSubscription,
    ]
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6"></div>
      <ExpresionesTable expresiones={expresiones} years={years} />
    </div>
  )
}
