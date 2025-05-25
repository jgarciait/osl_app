"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { ExpresionesTable } from "@/components/expresiones-table"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AvailableNumbersDialog } from "@/components/available-numbers-dialog"
import { RequestManager } from "@/lib/request-manager"
import { Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

  // Estados para paginación del servidor
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(5)
  const [isLoadingPage, setIsLoadingPage] = useState(false)

  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchTotalCount, setSearchTotalCount] = useState(0)
  const [disableTableFilters, setDisableTableFilters] = useState(false)

  // Refs for cleanup
  const subscriptions = useRef([])
  const dataFetched = useRef(false)
  const searchTimeout = useRef(null)

  const cleanupSubscriptions = useCallback(() => {
    subscriptions.current.forEach((subscription) => subscription.unsubscribe())
    subscriptions.current = []
  }, [])

  // Función para obtener el conteo total
  const fetchTotalCount = useCallback(
    async (searchQuery = "") => {
      try {
        let query = supabase.from("expresiones").select("*", { count: "exact", head: true })

        // Si hay búsqueda, aplicar SOLO filtro de búsqueda (ignorar todos los demás filtros)
        if (searchQuery.trim()) {
          query = query.or(`nombre.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,numero.ilike.%${searchQuery}%`)
          // NO aplicar ningún otro filtro cuando hay búsqueda activa
        }

        const { count, error } = await query

        if (error) throw error

        if (searchQuery.trim()) {
          setSearchTotalCount(count || 0)
        } else {
          setTotalCount(count || 0)
        }

        return count || 0
      } catch (error) {
        console.error("Error fetching total count:", error)
        return 0
      }
    },
    [supabase],
  )

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

  // Función para cargar expresiones con paginación del servidor
  const fetchExpresiones = useCallback(
    async (page = 0, searchQuery = "") => {
      try {
        console.log(`Fetching expressions page ${page}${searchQuery ? ` with search: "${searchQuery}"` : ""}...`)

        const offset = page * pageSize

        // Construir query base
        let query = supabase
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

        // Si hay búsqueda, aplicar SOLO filtro de búsqueda (desactivar todos los demás filtros)
        if (searchQuery.trim()) {
          query = query.or(`nombre.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,numero.ilike.%${searchQuery}%`)
          // NO aplicar ningún otro filtro cuando hay búsqueda activa
        }

        // Aplicar paginación
        query = query.range(offset, offset + pageSize - 1)

        const { data, error } = await query

        if (error) throw error

        console.log(`Fetched ${data?.length || 0} expressions for page ${page}`)

        return data || []
      } catch (error) {
        console.error(`Error fetching expressions page ${page}:`, error)
        throw error
      }
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

  // Función para procesar datos de expresiones
  const processExpresionData = useCallback((expresionData, additionalData) => {
    return expresionData.map((expresion) => {
      // Get tema name
      let tema_nombre = "Sin asignar"
      if (expresion.tema) {
        tema_nombre = additionalData.temasMap.get(expresion.tema) || "Sin asignar"
      }

      // Get assigned user name
      const assigned_to_name = expresion.assigned_to ? additionalData.userMap.get(expresion.assigned_to) || null : null

      return {
        ...expresion,
        tema_nombre,
        assigned_to_name,
        document_tags: [],
        document_tag_names: [],
      }
    })
  }, [])

  // Función para cargar una página específica
  const loadPage = useCallback(
    async (page, searchQuery = "") => {
      if (isLoadingPage) return

      try {
        setIsLoadingPage(true)

        const [expressionsData, additionalData] = await Promise.all([
          fetchExpresiones(page, searchQuery),
          fetchAdditionalData(),
        ])

        const processedData = processExpresionData(expressionsData, additionalData)
        setExpresiones(processedData)
        setCurrentPage(page)

        console.log(`Loaded page ${page} with ${processedData.length} expressions`)
      } catch (error) {
        console.error("Error loading page:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las expresiones de esta página",
        })
      } finally {
        setIsLoadingPage(false)
      }
    },
    [isLoadingPage, fetchExpresiones, fetchAdditionalData, processExpresionData, toast],
  )

  // Manejar búsqueda con debounce
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query)

      // Limpiar timeout anterior
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }

      // Si la query está vacía, salir del modo búsqueda y reactivar filtros
      if (!query.trim()) {
        setIsSearchMode(false)
        setIsSearching(false)
        setDisableTableFilters(false) // Reactivar filtros de la tabla
        // Recargar página actual sin búsqueda
        loadPage(currentPage)
        return
      }

      setIsSearching(true)
      setIsSearchMode(true)
      setDisableTableFilters(true) // Desactivar filtros de la tabla

      // Establecer nuevo timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          // Obtener conteo total de búsqueda (sin filtros)
          await fetchTotalCount(query)
          // Cargar primera página de resultados (sin filtros)
          await loadPage(0, query)
        } catch (error) {
          console.error("Error in search:", error)
        } finally {
          setIsSearching(false)
        }
      }, 500) // 500ms de debounce
    },
    [loadPage, currentPage, fetchTotalCount],
  )

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setIsSearchMode(false)
    setIsSearching(false)
    setSearchTotalCount(0)
    setDisableTableFilters(false) // Reactivar filtros de la tabla
    // Recargar página actual sin búsqueda
    loadPage(0)
    setCurrentPage(0)
  }, [loadPage])

  // Main data fetching effect
  useEffect(() => {
    if (dataFetched.current) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        dataFetched.current = true

        console.log("=== Starting initial data load ===")

        // Load all data in parallel
        const [staticData, totalCount] = await Promise.all([fetchStaticData(), fetchTotalCount()])

        // Set static data
        setTagMap(staticData.etiquetasMap)
        setYears(staticData.uniqueYears)

        // Load first page
        await loadPage(0)

        console.log("=== Initial data load complete ===")
        console.log(`Total expressions: ${totalCount}`)
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
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [fetchStaticData, fetchTotalCount, loadPage, cleanupSubscriptions, toast])

  // Funciones de navegación
  const goToPage = useCallback(
    (page) => {
      if (page < 0) return
      const maxPage = Math.ceil((isSearchMode ? searchTotalCount : totalCount) / pageSize) - 1
      if (page > maxPage) return

      loadPage(page, isSearchMode ? searchQuery : "")
    },
    [loadPage, isSearchMode, searchQuery, searchTotalCount, totalCount, pageSize],
  )

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [goToPage, currentPage])

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [goToPage, currentPage])

  // Calcular información de paginación
  const currentTotal = isSearchMode ? searchTotalCount : totalCount
  const totalPages = Math.ceil(currentTotal / pageSize)
  const hasNextPage = currentPage < totalPages - 1
  const hasPrevPage = currentPage > 0

  // Memoize props to prevent unnecessary rerenders
  const memoizedProps = useMemo(
    () => ({
      expresiones,
      years,
      tagMap,
      disableFilters: disableTableFilters,
      // Props de búsqueda para mover a la tabla
      searchQuery,
      isSearching,
      isSearchMode,
      onSearchChange: handleSearch,
      onClearSearch: clearSearch,
      searchTotalCount,
      // Pasar información de paginación del servidor
      serverPagination: {
        currentPage,
        totalPages,
        totalCount: currentTotal,
        pageSize,
        hasNextPage,
        hasPrevPage,
        goToPage,
        goToNextPage,
        goToPrevPage,
        isLoading: isLoadingPage,
      },
    }),
    [
      expresiones,
      years,
      tagMap,
      disableTableFilters,
      searchQuery,
      isSearching,
      isSearchMode,
      handleSearch,
      clearSearch,
      searchTotalCount,
      currentPage,
      totalPages,
      currentTotal,
      pageSize,
      hasNextPage,
      hasPrevPage,
      goToPage,
      goToNextPage,
      goToPrevPage,
      isLoadingPage,
    ],
  )

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  return (
    <div className="w-full">
      {/* Header con información y búsqueda */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Información de búsqueda */}
        {isSearchMode && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              {searchTotalCount} resultados para "{searchQuery}"
            </Badge>
          </div>
        )}

        {/* Barra de búsqueda - se moverá a la tabla */}
      </div>

      {/* Tabla de expresiones */}
      {isLoading ? (
        <div className="w-full flex flex-col justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500">Cargando expresiones...</p>
        </div>
      ) : (
        <>
          <ExpresionesTable {...memoizedProps} />

          {/* Mensaje cuando no hay resultados */}
          {expresiones.length === 0 && !isLoading && (
            <div className="text-center mt-6 text-gray-500">
              {isSearchMode
                ? `No se encontraron expresiones que coincidan con "${searchQuery}"`
                : "No hay expresiones disponibles"}
            </div>
          )}
        </>
      )}

      <AvailableNumbersDialog open={isAvailableNumbersDialogOpen} onOpenChange={setIsAvailableNumbersDialogOpen} />
    </div>
  )
}
