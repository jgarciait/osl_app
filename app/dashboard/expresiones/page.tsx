"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createClientClient, cachedQuery } from "@/lib/supabase-client"
import { ExpresionesTable } from "@/components/expresiones-table"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AvailableNumbersDialog } from "@/components/available-numbers-dialog"

export default function ExpresionesPage() {
  const [expresiones, setExpresiones] = useState([])
  const [years, setYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagMap, setTagMap] = useState({})
  const supabase = createClientClient()
  const { toast } = useToast()
  const router = useRouter()
  const [isAvailableNumbersDialogOpen, setIsAvailableNumbersDialogOpen] = useState(false)

  // Use refs to prevent unnecessary rerenders
  const subscriptions = useRef([])
  const dataFetched = useRef(false)

  // Memoize the cleanup function
  const cleanupSubscriptions = useCallback(() => {
    subscriptions.current.forEach((subscription) => subscription.unsubscribe())
    subscriptions.current = []
  }, [])

  // Memoize the fetch function to prevent recreation
  const fetchData = useCallback(async () => {
    if (dataFetched.current) return

    try {
      setIsLoading(true)
      dataFetched.current = true

      // Get all tags and create a map of ID to name
      const { data: etiquetas, error: etiquetasError } = await supabase.from("etiquetas").select("id, nombre, color")

      if (etiquetasError) {
        console.error("Error al obtener etiquetas:", etiquetasError)
        throw etiquetasError
      }

      // Create tag map
      const etiquetasMap = {}
      etiquetas?.forEach((etiqueta) => {
        etiquetasMap[etiqueta.id] = etiqueta.nombre
      })
      setTagMap(etiquetasMap)

      // Get user profiles with cache
      const profiles = await cachedQuery("profiles", () => supabase.from("profiles").select("id, nombre, apellido"))

      // Get themes with cache
      const temas = await cachedQuery("temas", () => supabase.from("temas").select("id, nombre"))

      // Create user map
      const userMap = new Map()
      profiles?.data?.forEach((profile) => {
        userMap.set(profile.id, `${profile.nombre} ${profile.apellido}`)
      })

      // Get expressions - FIXED QUERY
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

      console.log("=== DEBUG EXPRESIONES ===")
      console.log("Raw data from query:", data)
      console.log("Number of expressions:", data?.length || 0)
      console.log("Query error:", error)
      console.log("========================")

      if (error) {
        console.error("Error al obtener expresiones:", error)
        throw error
      }

      // Get expression-tema relationships separately
      const { data: expresionTemas, error: expresionTemasError } = await supabase
        .from("expresion_temas")
        .select("expresion_id, tema_id")

      if (expresionTemasError) {
        console.error("Error al obtener relaciones expresion-tema:", expresionTemasError)
      }

      // Get documents and their tags separately
      let documentosConEtiquetas = []
      if (data && data.length > 0) {
        const expresionIds = data.map((exp) => exp.id)

        const { data: docsData, error: docsError } = await supabase
          .from("documentos")
          .select(`
            id,
            expresion_id,
            documento_etiquetas(etiqueta_id)
          `)
          .in("expresion_id", expresionIds)

        if (docsError) {
          console.error("Error al obtener documentos:", docsError)
        } else {
          documentosConEtiquetas = docsData || []
        }
      }

      // Create tema map
      const temasMap = new Map()
      temas?.data?.forEach((tema) => {
        temasMap.set(tema.id, tema.nombre)
      })

      // Process data to include tema name and assigned user name
      const expresionTemasMap = new Map()
      if (expresionTemas) {
        expresionTemas.forEach((rel) => {
          if (!expresionTemasMap.has(rel.expresion_id)) {
            expresionTemasMap.set(rel.expresion_id, [])
          }
          expresionTemasMap.get(rel.expresion_id).push(rel.tema_id)
        })
      }

      const temasMap2 = new Map()
      temas?.data?.forEach((tema) => {
        temasMap2.set(tema.id, tema.nombre)
      })

      // Create document tags map
      const expresionEtiquetasMap = new Map()
      documentosConEtiquetas.forEach((doc) => {
        if (doc.documento_etiquetas && doc.documento_etiquetas.length > 0) {
          const tagIds = doc.documento_etiquetas.map((tag) => tag.etiqueta_id)

          if (!expresionEtiquetasMap.has(doc.expresion_id)) {
            expresionEtiquetasMap.set(doc.expresion_id, new Set())
          }

          tagIds.forEach((tagId) => {
            expresionEtiquetasMap.get(doc.expresion_id).add(tagId)
          })
        }
      })

      // Process data
      const processedData =
        data?.map((expresion) => {
          // Get tema name
          let tema_nombre = "Sin asignar"

          // Try from relationships first
          const temasRelacionados = expresionTemasMap.get(expresion.id)
          if (temasRelacionados && temasRelacionados.length > 0) {
            const primerTemaId = temasRelacionados[0]
            tema_nombre = temasMap2.get(primerTemaId) || "Sin asignar"
          }
          // Fallback to direct tema field
          else if (expresion.tema) {
            tema_nombre = temasMap2.get(expresion.tema) || "Sin asignar"
          }

          // Get assigned user name
          const assigned_to_name = expresion.assigned_to ? userMap.get(expresion.assigned_to) || null : null

          // Get document tags
          const tagIds = expresionEtiquetasMap.has(expresion.id)
            ? Array.from(expresionEtiquetasMap.get(expresion.id))
            : []
          const tagNames = tagIds.map((id) => etiquetasMap[id] || id)

          return {
            ...expresion,
            tema_nombre,
            assigned_to_name,
            document_tags: tagIds,
            document_tag_names: tagNames,
          }
        }) || []

      console.log("Processed data:", processedData)
      console.log("Number of processed expressions:", processedData.length)

      setExpresiones(processedData)

      // Get unique years for filter
      const uniqueYears = [...new Set(data?.map((item) => item.ano) || [])].sort((a, b) => b - a)
      setYears(uniqueYears)
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
  }, [supabase, toast])

  // Single useEffect that doesn't cause rerenders
  useEffect(() => {
    fetchData()

    // Cleanup on unmount
    return () => {
      cleanupSubscriptions()
    }
  }, [fetchData, cleanupSubscriptions])

  // Memoize the component props to prevent unnecessary rerenders
  const memoizedProps = useMemo(
    () => ({
      expresiones,
      years,
      tagMap,
    }),
    [expresiones, years, tagMap],
  )

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6"></div>
      <ExpresionesTable {...memoizedProps} />
      <AvailableNumbersDialog open={isAvailableNumbersDialogOpen} onOpenChange={setIsAvailableNumbersDialogOpen} />
    </div>
  )
}
