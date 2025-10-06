"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClientClient, cachedQuery } from "@/lib/supabase-client"
import { ExpresionesTable } from "@/components/expresiones-table"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AvailableNumbersDialog } from "@/components/available-numbers-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExpresionesPage() {
  const [expresiones, setExpresiones] = useState([])
  const [years, setYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagMap, setTagMap] = useState({})
  const supabase = createClientClient()
  const { toast } = useToast()
  const router = useRouter()
  const [isAvailableNumbersDialogOpen, setIsAvailableNumbersDialogOpen] = useState(false)
  const [globalSearchTerm, setGlobalSearchTerm] = useState("")
  const [globalSearchResults, setGlobalSearchResults] = useState({ active: [], archived: [] })
  const [activeTab, setActiveTab] = useState("active")

  // Añadir refs para las suscripciones
  const subscriptions = useRef([])

  // Función para limpiar suscripciones
  const cleanupSubscriptions = () => {
    subscriptions.current.forEach((subscription) => subscription.unsubscribe())
    subscriptions.current = []
  }

  // Move setupRealtimeSubscriptions outside useEffect and make it a useCallback
  const setupRealtimeSubscriptions = useCallback(
    (userMap, temasMap, expresionTemasMap) => {
      // Limpiar suscripciones existentes antes de crear nuevas
      cleanupSubscriptions()

      // Suscribirse a cambios en expresiones
      const expresionesSubscription = supabase
        .channel(`expresiones-changes-${Date.now()}`) // Add timestamp to make channel unique
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
                  document_tags: [],
                  document_tag_names: [],
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
                    const assigned_to_name = payload.new.assigned_to
                      ? userMap.get(payload.new.assigned_to) || null
                      : null

                    return {
                      ...payload.new,
                      tema_nombre,
                      assigned_to_name,
                      document_tags: exp.document_tags || [],
                      document_tag_names: exp.document_tag_names || [],
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
        .channel(`expresion-comites-changes-${Date.now()}`)
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
        .channel(`expresion-clasificaciones-changes-${Date.now()}`)
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
        .channel(`documentos-changes-${Date.now()}`)
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
    },
    [supabase],
  )

  // Update the useEffect to use the callback and have better dependency management
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted) return

      try {
        setIsLoading(true)

        // Obtener todas las etiquetas y crear un mapa de ID a nombre
        const { data: etiquetas, error: etiquetasError } = await supabase.from("etiquetas").select("id, nombre, color")

        if (etiquetasError) {
          console.error("Error al obtener etiquetas:", etiquetasError)
          throw etiquetasError
        }

        // Crear un mapa de ID a nombre de etiqueta
        const etiquetasMap = {}
        etiquetas.forEach((etiqueta) => {
          etiquetasMap[etiqueta.id] = etiqueta.nombre
        })

        // Guardar el mapa de etiquetas
        if (isMounted) setTagMap(etiquetasMap)

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
        let processedData = data.map((expresion) => {
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

        // Después de procesar los datos de expresiones, cargar información de etiquetas
        if (data && data.length > 0) {
          try {
            // Obtener IDs de todas las expresiones
            const expresionIds = data.map((exp) => exp.id)

            // Primero obtener todos los documentos de estas expresiones
            const { data: documentos, error: documentosError } = await supabase
              .from("documentos")
              .select("id, expresion_id")
              .in("expresion_id", expresionIds)

            if (documentosError) {
              console.error("Error al obtener documentos:", documentosError.message || documentosError)
              // Continue without tags instead of throwing
            } else if (documentos && documentos.length > 0) {
              const documentoIds = documentos.map((doc) => doc.id)

              // Ahora obtener las etiquetas de esos documentos
              const { data: documentoEtiquetas, error: etiquetasError } = await supabase
                .from("documento_etiquetas")
                .select("documento_id, etiqueta_id")
                .in("documento_id", documentoIds)

              if (etiquetasError) {
                console.error("Error al obtener etiquetas de documentos:", etiquetasError.message || etiquetasError)
                // Continue without tags instead of throwing
              } else if (documentoEtiquetas) {
                // Crear un mapa de documento a expresión
                const docToExpresionMap = new Map()
                documentos.forEach((doc) => {
                  docToExpresionMap.set(doc.id, doc.expresion_id)
                })

                // Crear un mapa de expresión a etiquetas
                const expresionEtiquetasMap = new Map()

                // Procesar los datos para agrupar etiquetas por expresión
                documentoEtiquetas.forEach((docTag) => {
                  const expresionId = docToExpresionMap.get(docTag.documento_id)
                  if (expresionId) {
                    if (!expresionEtiquetasMap.has(expresionId)) {
                      expresionEtiquetasMap.set(expresionId, new Set())
                    }
                    expresionEtiquetasMap.get(expresionId).add(docTag.etiqueta_id)
                  }
                })

                // Actualizar los datos procesados con la información de etiquetas
                processedData = processedData.map((exp) => {
                  const tagIds = expresionEtiquetasMap.has(exp.id) ? Array.from(expresionEtiquetasMap.get(exp.id)) : []

                  // Convertir IDs a nombres de etiquetas
                  const tagNames = tagIds.map((id) => etiquetasMap[id] || id)

                  return {
                    ...exp,
                    document_tags: tagIds,
                    document_tag_names: tagNames,
                  }
                })
              }
            }
          } catch (tagError) {
            console.error("Error al procesar etiquetas de documentos:", tagError)
            // Continue without tags - don't throw
            processedData = processedData.map((exp) => ({
              ...exp,
              document_tags: [],
              document_tag_names: [],
            }))
          }
        }

        if (isMounted) {
          setExpresiones(processedData)

          // Obtener años únicos para el filtro
          const uniqueYears = [...new Set(data.map((item) => item.ano))].sort((a, b) => b - a)
          setYears(uniqueYears)

          // Configurar suscripciones en tiempo real
          setupRealtimeSubscriptions(userMap, temasMap, expresionTemasMap)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las expresiones. Por favor, intente nuevamente.",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup function
    return () => {
      isMounted = false
      cleanupSubscriptions()
    }
  }, [supabase, toast, setupRealtimeSubscriptions])

  // Función para realizar búsqueda global en todas las expresiones
  const handleGlobalSearch = (searchTerm: string) => {
    setGlobalSearchTerm(searchTerm)

    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, limpiar resultados
      setGlobalSearchResults({ active: [], archived: [] })
      return
    }

    // Buscar en todas las expresiones
    const searchTermLower = searchTerm.toLowerCase()

    // Filtrar expresiones activas que coincidan con la búsqueda
    const activeResults = expresiones
      .filter((exp) => !exp.archivado)
      .filter(
        (exp) =>
          exp.numero?.toString().toLowerCase().includes(searchTermLower) ||
          exp.nombre?.toLowerCase().includes(searchTermLower) ||
          exp.email?.toLowerCase().includes(searchTermLower) ||
          exp.tema_nombre?.toLowerCase().includes(searchTermLower),
      )

    // Filtrar expresiones archivadas que coincidan con la búsqueda
    const archivedResults = expresiones
      .filter((exp) => exp.archivado)
      .filter(
        (exp) =>
          exp.numero?.toString().toLowerCase().includes(searchTermLower) ||
          exp.nombre?.toLowerCase().includes(searchTermLower) ||
          exp.email?.toLowerCase().includes(searchTermLower) ||
          exp.tema_nombre?.toLowerCase().includes(searchTermLower),
      )

    // Actualizar resultados
    setGlobalSearchResults({
      active: activeResults,
      archived: archivedResults,
    })
  }

  return (
    <div className="w-full">
      <div className="justify-between items-center mb-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar en todas las expresiones..."
            value={globalSearchTerm}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            className="h-8 w-full lg:w-[250px] text-sm pl-3 pr-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="active">
            Expresiones Activas
            {globalSearchTerm && globalSearchResults.active.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {globalSearchResults.active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Expresiones Archivadas
            {globalSearchTerm && globalSearchResults.archived.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {globalSearchResults.archived.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ExpresionesTable
            expresiones={globalSearchTerm ? globalSearchResults.active : expresiones.filter((exp) => !exp.archivado)}
            years={years}
            tagMap={tagMap}
            hideStatusFilter={true}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <ExpresionesTable
            expresiones={globalSearchTerm ? globalSearchResults.archived : expresiones.filter((exp) => exp.archivado)}
            years={years}
            tagMap={tagMap}
            hideStatusFilter={true}
            defaultFilters={[]} // Don't apply any default filters for archived tab
          />
        </TabsContent>
      </Tabs>

      {/* Diálogo para seleccionar números disponibles */}
      <AvailableNumbersDialog open={isAvailableNumbersDialogOpen} onOpenChange={setIsAvailableNumbersDialogOpen} />
    </div>
  )
}
