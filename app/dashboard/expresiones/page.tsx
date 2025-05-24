"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { ExpresionesTable } from "@/components/expresiones-table"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AvailableNumbersDialog } from "@/components/available-numbers-dialog"
import { RequestManager } from "@/lib/request-manager"

// Initialize request manager singleton
const requestManager = new RequestManager()

export default function ExpresionesPage() {
  const [expresiones, setExpresiones] = useState([])
  const [years, setYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagMap, setTagMap] = useState({})
  const supabase = createClientClient()
  const { toast } = useToast()
  const router = useRouter()
  const [isAvailableNumbersDialogOpen, setIsAvailableNumbersDialogOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Refs for cleanup
  const subscriptions = useRef([])
  const dataFetched = useRef(false)

  const cleanupSubscriptions = useCallback(() => {
    subscriptions.current.forEach((subscription) => subscription.unsubscribe())
    subscriptions.current = []
  }, [])

  // Memoized function to fetch static data (etiquetas, years)
  const fetchStaticData = useCallback(async () => {
    return requestManager.dedupe("static-data", async () => {
      try {
        console.log("Fetching static data...")

        // Fetch etiquetas and years in parallel
        const [etiquetasResult, yearsResult] = await Promise.all([
          supabase.from("etiquetas").select("id, nombre, color"),
          supabase.from("expresiones").select("ano").order("ano", { ascending: false }),
        ])

        if (etiquetasResult.error) throw etiquetasResult.error
        if (yearsResult.error) throw yearsResult.error

        // Process etiquetas map
        const etiquetasMap = {}
        etiquetasResult.data?.forEach((etiqueta) => {
          etiquetasMap[etiqueta.id] = etiqueta.nombre
        })

        // Get unique years
        const uniqueYears = [...new Set(yearsResult.data?.map((item) => item.ano) || [])].sort((a, b) => b - a)

        console.log("Static data fetched:", { etiquetas: etiquetasResult.data?.length, years: uniqueYears.length })

        return { etiquetasMap, uniqueYears }
      } catch (error) {
        console.error("Error fetching static data:", error)
        throw error
      }
    })
  }, [supabase])

  // Memoized function to fetch expressions with pagination
  const fetchExpresiones = useCallback(
    async (page = 0) => {
      const cacheKey = `expresiones-page-${page}`

      return requestManager.dedupe(cacheKey, async () => {
        try {
          console.log(`Fetching expressions page ${page}...`)

          const offset = page * pageSize

          // Get total count (only on first page)
          if (page === 0) {
            const { count, error: countError } = await supabase
              .from("expresiones")
              .select("*", { count: "exact", head: true })

            if (countError) throw countError
            setTotalCount(count || 0)
            setHasNextPage(offset + pageSize < (count || 0))
          }

          // Get expressions with basic relations
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
            .range(offset, offset + pageSize - 1)

          if (error) throw error

          console.log(`Fetched ${data?.length || 0} expressions for page ${page}`)

          return data || []
        } catch (error) {
          console.error(`Error fetching expressions page ${page}:`, error)
          throw error
        }
      })
    },
    [supabase, pageSize],
  )

  // Memoized function to fetch additional data (profiles, temas, etc.)
  const fetchAdditionalData = useCallback(async () => {
    return requestManager.dedupe("additional-data", async () => {
      try {
        console.log("Fetching additional data...")

        const [profilesResult, temasResult] = await Promise.all([
          supabase.from("profiles").select("id, nombre, apellido"),
          supabase.from("temas").select("id, nombre"),
        ])

        if (profilesResult.error) throw profilesResult.error
        if (temasResult.error) throw temasResult.error

        // Create user map
        const userMap = new Map()
        profilesResult.data?.forEach((profile) => {
          userMap.set(profile.id, `${profile.nombre} ${profile.apellido}`)
        })

        // Create tema map
        const temasMap = new Map()
        temasResult.data?.forEach((tema) => {
          temasMap.set(tema.id, tema.nombre)
        })

        console.log("Additional data fetched:", {
          profiles: profilesResult.data?.length,
          temas: temasResult.data?.length,
        })

        return { userMap, temasMap }
      } catch (error) {
        console.error("Error fetching additional data:", error)
        throw error
      }
    })
  }, [supabase])

  // Main data fetching effect
  useEffect(() => {
    if (dataFetched.current) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        dataFetched.current = true

        console.log("=== Starting data load ===")

        // Load all data in parallel
        const [staticData, expressionsData, additionalData] = await Promise.all([
          fetchStaticData(),
          fetchExpresiones(0),
          fetchAdditionalData(),
        ])

        // Set static data
        setTagMap(staticData.etiquetasMap)
        setYears(staticData.uniqueYears)

        // Process expressions data
        const processedData = expressionsData.map((expresion) => {
          // Get tema name
          let tema_nombre = "Sin asignar"
          if (expresion.tema) {
            tema_nombre = additionalData.temasMap.get(expresion.tema) || "Sin asignar"
          }

          // Get assigned user name
          const assigned_to_name = expresion.assigned_to
            ? additionalData.userMap.get(expresion.assigned_to) || null
            : null

          return {
            ...expresion,
            tema_nombre,
            assigned_to_name,
            document_tags: [], // Will be loaded separately if needed
            document_tag_names: [],
          }
        })

        setExpresiones(processedData)

        console.log("=== Data load complete ===")
        console.log("Request manager cache info:", requestManager.getCacheInfo())
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las expresiones. Por favor, intente nuevamente.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      cleanupSubscriptions()
    }
  }, [fetchStaticData, fetchExpresiones, fetchAdditionalData, cleanupSubscriptions, toast])

  // Memoize props to prevent unnecessary rerenders
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
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          {isLoading ? "Cargando..." : `Mostrando ${expresiones.length} de ${totalCount} expresiones`}
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-400">Cache: {requestManager.getCacheInfo().cacheSize} items</div>
        )}
      </div>

      <ExpresionesTable {...memoizedProps} />

      <AvailableNumbersDialog open={isAvailableNumbersDialogOpen} onOpenChange={setIsAvailableNumbersDialogOpen} />
    </div>
  )
}
