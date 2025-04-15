"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientClient, handleAuthError } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash, UserPlus, Loader2, Filter, FilterX, FileDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { ContextMenu } from "@/components/context-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Importar el generador de PDF
import { generateExpresionPDF } from "./expresion-pdf-generator"

// Importar el hook useGroupPermissions
import { useGroupPermissions } from "@/hooks/use-group-permissions"

// Caché para usuarios
const usersCache = {
  data: null,
  timestamp: 0,
}
const CACHE_DURATION = 60000 // 1 minuto

// Función de utilidad para reintentos con retroceso exponencial
async function fetchWithRetry(fetchFn, maxRetries = 3, initialDelay = 1000) {
  let retries = 0
  let delay = initialDelay

  while (retries < maxRetries) {
    try {
      return await fetchFn()
    } catch (error) {
      retries++

      // Si es el último intento, lanzar el error
      if (retries >= maxRetries) {
        throw error
      }

      // Verificar si es un error de "Too Many Requests"
      const isTooManyRequests =
        (error.message && error.message.includes("Too Many R")) ||
        (error instanceof SyntaxError && error.message.includes("Unexpected token"))

      // Si es un error de limitación de tasa, esperar más tiempo
      if (isTooManyRequests) {
        console.log(`Detectada limitación de tasa, reintentando en ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Retroceso exponencial
      } else {
        // Para otros errores, no esperar tanto
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }
}

interface ExpresionesTableProps {
  expresiones: any[]
  years: number[]
}

export function ExpresionesTable({ expresiones, years }: ExpresionesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()
  const { hasPermission } = useGroupPermissions()
  const canManageExpressions = hasPermission("expressions", "manage")
  const canViewExpressions = hasPermission("expressions", "view")

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "estado",
      value: ["Activa"],
    },
  ])
  const [rowSelection, setRowSelection] = useState({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expressionToDelete, setExpressionToDelete] = useState(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; data: any } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [expressionToAssign, setExpressionToAssign] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [expresionesData, setExpresiones] = useState(expresiones)
  const [assignedUsers, setAssignedUsers] = useState([])
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false)
  const [expressionToChangeColor, setExpressionToChangeColor] = useState(null)
  const [selectedColor, setSelectedColor] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [isFilteringByCurrentUser, setIsFilteringByCurrentUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Ref para controlar las solicitudes de datos
  const isDataFetched = useRef(false)

  // Añadir refs para las suscripciones
  const realtimeSubscriptions = useRef([])

  // Función para limpiar suscripciones
  const cleanupRealtimeSubscriptions = () => {
    realtimeSubscriptions.current.forEach((subscription) => subscription.unsubscribe())
    realtimeSubscriptions.current = []
  }

  // Añadir este useEffect para configurar suscripciones en tiempo real
  useEffect(() => {
    // Configurar suscripciones en tiempo real para las tablas relacionadas
    const setupRealtimeSubscriptions = () => {
      // Limpiar suscripciones existentes
      cleanupRealtimeSubscriptions()

      // Suscribirse a cambios en document_etiquetas
      const documentEtiquetasSubscription = supabase
        .channel("document-etiquetas-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "documento_etiquetas",
          },
          (payload) => {
            console.log("Cambio en documento_etiquetas:", payload)
            // Si estamos viendo documentos de una expresión específica,
            // podríamos actualizar las etiquetas aquí
          },
        )
        .subscribe()

      // Suscribirse a cambios en etiquetas
      const etiquetasSubscription = supabase
        .channel("etiquetas-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "etiquetas",
          },
          (payload) => {
            console.log("Cambio en etiquetas:", payload)
            // Actualizar las etiquetas si cambian sus nombres o colores
          },
        )
        .subscribe()

      // Suscribirse a cambios en clasificaciones
      const clasificacionesSubscription = supabase
        .channel("clasificaciones-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "clasificaciones",
          },
          (payload) => {
            console.log("Cambio en clasificaciones:", payload)
            // Actualizar las clasificaciones si cambian
          },
        )
        .subscribe()

      // Suscribirse a cambios en comites
      const comitesSubscription = supabase
        .channel("comites-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comites",
          },
          (payload) => {
            console.log("Cambio en comites:", payload)
            // Actualizar los comités si cambian
          },
        )
        .subscribe()

      // Guardar referencias a las suscripciones
      realtimeSubscriptions.current = [
        documentEtiquetasSubscription,
        etiquetasSubscription,
        clasificacionesSubscription,
        comitesSubscription,
      ]
    }

    setupRealtimeSubscriptions()

    // Limpiar suscripciones al desmontar
    return () => {
      cleanupRealtimeSubscriptions()
    }
  }, [supabase])

  // Actualizar expresionesData cuando cambian las expresiones recibidas como prop
  useEffect(() => {
    setExpresiones(expresiones)
  }, [expresiones])

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "numero",
        header: "Número",
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const email = row.original.email
          if (!email) return <span className="text-gray-400 text-xs">No disponible</span>
          return email
        },
      },
      {
        accessorKey: "tema_nombre",
        header: "Tema",
      },
      {
        accessorKey: "estado",
        header: "Estatus",
        accessorFn: (row) => (row.archivado ? "Archivada" : "Activa"),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
        cell: ({ row }) => {
          const archived = row.original.archivado
          return (
            <span className={archived ? "text-gray-500 font-medium" : "text-green-600 font-medium"}>
              {archived ? "Archivada" : "Activa"}
            </span>
          )
        },
      },
      {
        accessorKey: "ano",
        header: "Año",
        accessorFn: (row) => row.ano.toString(),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
      },
      {
        accessorKey: "mes",
        header: "Mes",
        accessorFn: (row) => row.mes.toString(),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
        cell: ({ row }) => {
          const month = row.original.mes
          const monthNames = [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
          ]
          return monthNames[month - 1]
        },
      },
      {
        accessorKey: "assigned_to_name",
        header: "Asignado a",
        filterFn: (row, id, value) => {
          // Si el valor incluye "Sin asignar" y el valor de la celda es null o vacío, devuelve true
          if (value.includes("Sin asignar") && (!row.getValue(id) || row.getValue(id) === "")) {
            return true
          }
          // Para otros valores, comprueba si el valor de la celda está en el array de valores
          return value.includes(row.getValue(id))
        },
        cell: ({ row }) => {
          const assignedTo = row.original.assigned_to_name
          if (!assignedTo) return <span className="text-gray-400 text-xs">Sin asignar</span>

          // Generar un color único basado en el nombre del usuario o usar el color guardado
          const colorHash = assignedTo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
          const userColor = row.original.assigned_color || `hsl(${colorHash}, 70%, 90%)`
          const textColor = row.original.assigned_text_color || `hsl(${colorHash}, 70%, 30%)`
          const borderColor = row.original.assigned_border_color || `hsl(${colorHash}, 70%, 80%)`

          // Verificar si esta expresión está asignada al usuario actual
          const isCurrentUser = currentUser && row.original.assigned_to === currentUser.id

          return (
            <div className="flex items-center">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer group relative ${
                  isCurrentUser ? "ring-2 ring-offset-1 ring-blue-500" : ""
                }`}
                style={{
                  backgroundColor: userColor,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleColorChange(row.original)
                }}
              >
                {assignedTo}
                {isCurrentUser && <span className="ml-1 text-xs opacity-70">(Tú)</span>}
                <span
                  className="absolute -top-1 -right-1 size-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Cambiar color"
                ></span>
              </div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManageExpressions && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/expresiones/${row.original.id}/editar`)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {canViewExpressions && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/expresiones/${row.original.id}/ver`)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </DropdownMenuItem>
              )}
              {canManageExpressions && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpressionToAssign(row.original)
                    setIsAssignDialogOpen(true)
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Asignar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  // Usar la función original de generación de PDF
                  handleGeneratePDF(row.original)
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
              {canManageExpressions && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpressionToDelete(row.original)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, currentUser, isGeneratingPDF, canManageExpressions, canViewExpressions],
  )

  // Función modificada para generar PDF con documentos adjuntos y comités
  const handleGeneratePDF = async (expresion: any) => {
    try {
      setIsGeneratingPDF(true)
      setIsLoading(true)

      // Ejecutar en un setTimeout para no bloquear la interfaz
      setTimeout(async () => {
        try {
          // Obtener los documentos adjuntos si existen
          let documentosAdjuntos = []
          try {
            const { data: docsData, error: docsErrorData } = await supabase
              .from("documentos")
              .select("id, nombre, tipo, created_at")
              .eq("expresion_id", expresion.id)

            if (docsErrorData) {
              console.error("Error al obtener documentos:", docsErrorData)
            } else if (docsData) {
              documentosAdjuntos = docsData
            }
          } catch (error) {
            console.error("Error al consultar documentos:", error)
          }

          // Obtener los comités relacionados con la expresión
          let comitesRelacionados = []
          try {
            // Primero obtenemos las relaciones
            const { data: relacionesData, error: relacionesError } = await supabase
              .from("expresion_comites")
              .select("comite_id")
              .eq("expresion_id", expresion.id)

            if (relacionesError) {
              console.error("Error al obtener relaciones con comités:", relacionesError)
            } else if (relacionesData && relacionesData.length > 0) {
              // Luego obtenemos los detalles de los comités
              const comiteIds = relacionesData.map((rel) => rel.comite_id)

              const { data: comitesData, error: comitesError } = await supabase
                .from("comites")
                .select("id, nombre, tipo")
                .in("id", comiteIds)

              if (comitesError) {
                console.error("Error al obtener detalles de comités:", comitesError)
              } else if (comitesData) {
                comitesRelacionados = comitesData
              }
            }
          } catch (error) {
            console.error("Error al consultar comités relacionados:", error)
          }

          // Obtener datos completos de la expresión
          const { data, error } = await supabase
            .from("view_expresiones_with_assignment")
            .select("*")
            .eq("id", expresion.id)
            .single()

          if (error) {
            console.error("Error al obtener datos de la expresión:", error)
            toast({
              title: "Error",
              description: "No se pudo generar el PDF. Intente nuevamente.",
              variant: "destructive",
            })
            setIsLoading(false)
            setIsGeneratingPDF(false)
            return
          }

          // Generar el PDF con los datos obtenidos
          await generateExpresionPDF(data, documentosAdjuntos, comitesRelacionados)

          toast({
            title: "PDF generado",
            description: "El PDF se ha generado correctamente.",
          })
        } catch (error) {
          console.error("Error al generar PDF:", error)
          toast({
            title: "Error",
            description: "No se pudo generar el PDF. Intente nuevamente.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
          setIsGeneratingPDF(false)
        }
      }, 0)
    } catch (error) {
      setIsLoading(false)
      setIsGeneratingPDF(false)
    }
  }

  // Obtener el usuario actual al cargar el componente
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // Evitar solicitudes repetidas
      if (isDataFetched.current) return

      try {
        setIsLoading(true)

        // Obtener la sesión actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          await handleAuthError(sessionError)
          throw sessionError
        }

        if (session) {
          // Obtener los detalles del perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profileError) throw profileError

          setCurrentUser({
            id: session.user.id,
            ...profileData,
          })
        }

        // Marcar que los datos ya se han cargado
        isDataFetched.current = true
      } catch (error) {
        console.error("Error al obtener el usuario actual:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener la información del usuario actual",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [supabase, toast])

  const table = useReactTable({
    data: expresionesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const statusOptions = [
    {
      label: "Activa",
      value: "Activa",
    },
    {
      label: "Archivada",
      value: "Archivada",
    },
  ]

  const yearOptions = years.map((year) => ({
    label: year.toString(),
    value: year.toString(),
  }))

  const monthOptions = [
    { label: "Enero", value: "1" },
    { label: "Febrero", value: "2" },
    { label: "Marzo", value: "3" },
    { label: "Abril", value: "4" },
    { label: "Mayo", value: "5" },
    { label: "Junio", value: "6" },
    { label: "Julio", value: "7" },
    { label: "Agosto", value: "8" },
    { label: "Septiembre", value: "9" },
    { label: "Octubre", value: "10" },
    { label: "Noviembre", value: "11" },
    { label: "Diciembre", value: "12" },
  ]

  const handleRowClick = useCallback(
    (row) => {
      router.push(`/dashboard/expresiones/${row.id}/editar`)
    },
    [router],
  )

  const handleRowRightClick = useCallback((e, row) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, data: row })
  }, [])

  const handleEdit = useCallback(() => {
    if (contextMenu?.data) {
      router.push(`/dashboard/expresiones/${contextMenu.data.id}/editar`)
      setContextMenu(null)
    }
  }, [router, contextMenu])

  const handleDelete = useCallback(async () => {
    if (contextMenu?.data) {
      setExpressionToDelete(contextMenu.data)
      setIsDeleteDialogOpen(true)
      setContextMenu(null)
    }
  }, [contextMenu])

  const fetchUsers = async () => {
    try {
      // Verificar si tenemos datos en caché y si son recientes
      const now = Date.now()
      if (usersCache.data && now - usersCache.timestamp < CACHE_DURATION) {
        setUsers(usersCache.data)
        return
      }

      // Usar la función cachedQuery para obtener los usuarios
      const { data, error } = await supabase.from("profiles").select("id, nombre, apellido, email")

      if (error) throw error

      // Guardar en caché
      usersCache.data = data || []
      usersCache.timestamp = now

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        variant: "destructive",
        title: "Error al cargar usuarios",
        description: "No se pudieron cargar los usuarios disponibles",
      })
    }
  }

  const handleAssignUser = async () => {
    if (!expressionToAssign) return

    setIsAssigning(true)

    try {
      // Si selectedUser es "none", establecer assigned_to a null
      const assignedTo = selectedUser === "none" ? null : selectedUser

      let updateData = {
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(), // Asegurar que se actualiza el timestamp
      }

      // Si hay un usuario asignado, buscar si ya tiene un color asignado
      if (assignedTo) {
        // Buscar otra expresión que ya tenga este usuario asignado
        const { data: existingAssignments, error: searchError } = await supabase
          .from("expresiones")
          .select("assigned_color, assigned_text_color, assigned_border_color")
          .eq("assigned_to", assignedTo)
          .not("assigned_color", "is", null)
          .limit(1)

        if (searchError) throw searchError

        // Si el usuario ya tiene un color asignado en otra expresión, usar ese color
        if (existingAssignments && existingAssignments.length > 0) {
          const { assigned_color, assigned_text_color, assigned_border_color } = existingAssignments[0]
          updateData = {
            ...updateData,
            assigned_color,
            assigned_text_color,
            assigned_border_color,
          }
        }
      }

      console.log("Actualizando expresión con datos:", updateData)
      console.log("ID de expresión:", expressionToAssign.id)

      // Actualizar la expresión con el usuario asignado y posiblemente el color
      const { data, error } = await supabase
        .from("expresiones")
        .update(updateData)
        .eq("id", expressionToAssign.id)
        .select()

      if (error) {
        console.error("Error al actualizar expresión:", error)
        throw error
      }

      console.log("Respuesta de actualización:", data)

      // Obtener el nombre del usuario asignado
      let assignedToName = null
      if (assignedTo) {
        const assignedUser = users.find((u) => u.id === assignedTo)
        if (assignedUser) {
          assignedToName = `${assignedUser.nombre} ${assignedUser.apellido}`
        }
      }

      toast({
        title: assignedTo ? "Expresión asignada" : "Asignación removida",
        description: assignedTo
          ? "La expresión ha sido asignada exitosamente"
          : "Se ha removido la asignación de la expresión",
      })

      // Actualizar los datos localmente
      setExpresiones((prev) =>
        prev.map((exp) =>
          exp.id === expressionToAssign.id
            ? {
                ...exp,
                assigned_to: assignedTo,
                assigned_to_name: assignedToName,
                ...(updateData.assigned_color
                  ? {
                      assigned_color: updateData.assigned_color,
                      assigned_text_color: updateData.assigned_text_color,
                      assigned_border_color: updateData.assigned_border_color,
                    }
                  : {}),
              }
            : exp,
        ),
      )

      setIsAssignDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error assigning expression:", error)
      toast({
        variant: "destructive",
        title: "Error al asignar",
        description: error.message || "Ocurrió un error al asignar la expresión",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleColorChange = (expression) => {
    setExpressionToChangeColor(expression)
    setSelectedColor(expression.assigned_color || "")
    setIsColorDialogOpen(true)
  }

  const saveColorChange = async () => {
    if (!expressionToChangeColor) return

    try {
      // Preparar los valores de color basados en el color seleccionado
      const colorValues = selectedColor
        ? {
            assigned_color: selectedColor,
            assigned_text_color: `hsl(${selectedColor.match(/\d+/)?.[0] || 0}, 70%, 30%)`,
            assigned_border_color: `hsl(${selectedColor.match(/\d+/)?.[0] || 0}, 70%, 80%)`,
          }
        : {
            assigned_color: null,
            assigned_text_color: null,
            assigned_border_color: null,
          }

      // Obtener el ID del usuario asignado
      const assignedUserId = expressionToChangeColor.assigned_to

      if (!assignedUserId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No hay usuario asignado a esta expresión",
        })
        return
      }

      // Actualizar todas las expresiones asignadas a este usuario
      const { error } = await supabase.from("expresiones").update(colorValues).eq("assigned_to", assignedUserId)

      if (error) throw error

      toast({
        title: "Color actualizado",
        description: "El color ha sido actualizado para todas las expresiones asignadas a este usuario",
      })

      // Actualizar los datos localmente
      setExpresiones((prev) =>
        prev.map((exp) =>
          exp.assigned_to === assignedUserId
            ? {
                ...exp,
                ...colorValues,
              }
            : exp,
        ),
      )

      setIsColorDialogOpen(false)
    } catch (error) {
      console.error("Error updating color:", error)
      toast({
        variant: "destructive",
        title: "Error al actualizar color",
        description: error.message || "Ocurrió un error al actualizar el color",
      })
    }
  }

  // Función para alternar el filtro de usuario actual
  const toggleCurrentUserFilter = () => {
    if (currentUser) {
      if (isFilteringByCurrentUser) {
        // Quitar el filtro de usuario actual
        setColumnFilters((prev) => prev.filter((filter) => filter.id !== "assigned_to_name"))
        setIsFilteringByCurrentUser(false)
      } else {
        // Añadir el filtro de usuario actual
        const fullName = `${currentUser.nombre} ${currentUser.apellido}`
        setColumnFilters((prev) => [
          ...prev.filter((filter) => filter.id !== "assigned_to_name"),
          {
            id: "assigned_to_name",
            value: [fullName],
          },
        ])
        setIsFilteringByCurrentUser(true)
      }
    }
  }

  useEffect(() => {
    if (isAssignDialogOpen) {
      fetchUsers()
    }
  }, [isAssignDialogOpen])

  const confirmDelete = async () => {
    if (!expressionToDelete) return

    setIsDeleting(true)

    try {
      // Primero eliminar las relaciones con comités
      const { error: comitesError } = await supabase
        .from("expresion_comites")
        .delete()
        .eq("expresion_id", expressionToDelete.id)

      if (comitesError) {
        console.error("Error eliminando relaciones con comités:", comitesError)
        throw comitesError
      }

      // Obtener los documentos asociados con sus rutas de almacenamiento
      const { data: documentos, error: docsQueryError } = await supabase
        .from("documentos")
        .select("id, ruta")
        .eq("expresion_id", expressionToDelete.id)

      if (docsQueryError) {
        console.error("Error consultando documentos:", docsQueryError)
        throw docsQueryError
      }

      // Si hay documentos, eliminar primero los archivos del bucket
      if (documentos && documentos.length > 0) {
        // Eliminar los archivos del bucket de almacenamiento
        for (const doc of documentos) {
          if (doc.ruta) {
            const { error: storageError } = await supabase.storage.from("documentos").remove([doc.ruta])

            if (storageError) {
              console.error(`Error eliminando archivo ${doc.ruta} del bucket:`, storageError)
              // Continuamos con el proceso aunque haya errores en la eliminación de archivos
            }
          }
        }

        // Eliminar las relaciones con etiquetas
        const { error: tagsError } = await supabase
          .from("documento_etiquetas")
          .delete()
          .in(
            "documento_id",
            documentos.map((doc) => doc.id),
          )

        if (tagsError) {
          console.error("Error eliminando etiquetas de documentos:", tagsError)
          throw tagsError
        }

        // Eliminar los registros de documentos de la base de datos
        const { error: docsDeleteError } = await supabase
          .from("documentos")
          .delete()
          .eq("expresion_id", expressionToDelete.id)

        if (docsDeleteError) {
          console.error("Error eliminando documentos:", docsDeleteError)
          throw docsDeleteError
        }
      }

      // Finalmente eliminar la expresión
      const { error: expresionError } = await supabase.from("expresiones").delete().eq("id", expressionToDelete.id)

      if (expresionError) {
        console.error("Error eliminando expresión:", expresionError)
        throw expresionError
      }

      toast({
        title: "Expresión eliminada",
        description: "La expresión ha sido eliminada exitosamente",
      })

      // Refrescar la página para mostrar los cambios
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar expresión:", error)
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar la expresión",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setExpressionToDelete(null)
    }
  }

  // Preparar opciones de usuarios asignados para el filtro
  const assignedUserOptions = useMemo(() => {
    const options = [{ label: "Sin asignar", value: "Sin asignar" }]

    // Añadir el usuario actual primero si existe
    if (currentUser) {
      options.push({
        label: `${currentUser.nombre} ${currentUser.apellido} (Tú)`,
        value: `${currentUser.nombre} ${currentUser.apellido}`,
      })
    }

    // Añadir el resto de usuarios
    users.forEach((user) => {
      // Evitar duplicar el usuario actual
      if (!currentUser || user.id !== currentUser.id) {
        options.push({
          label: `${user.nombre} ${user.apellido}`,
          value: `${user.nombre} ${user.apellido}`,
        })
      }
    })

    return options
  }, [users, currentUser])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {currentUser && (
            <Button
              variant={isFilteringByCurrentUser ? "default" : "outline"}
              size="sm"
              onClick={toggleCurrentUserFilter}
              className={isFilteringByCurrentUser ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isFilteringByCurrentUser ? (
                <>
                  <FilterX className="mr-2 h-4 w-4" />
                  Ver todas
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Ver mis asignaciones
                </>
              )}
            </Button>
          )}
          {isFilteringByCurrentUser && currentUser && (
            <Badge variant="secondary" className="ml-2">
              Filtrando: Mis asignaciones
            </Badge>
          )}
        </div>
      </div>

      <DataTableToolbar
        table={table}
        statusOptions={statusOptions}
        yearOptions={yearOptions}
        monthOptions={monthOptions}
        assignedUserOptions={assignedUserOptions}
      />

      {isLoading ? (
        <div className="w-full flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <DataTable
            table={table}
            columns={columns}
            onRowClick={handleRowClick}
            onRowRightClick={handleRowRightClick}
            canEdit={canManageExpressions}
          />
          <DataTablePagination table={table} />
        </>
      )}

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="¿Está seguro de que desea eliminar esta expresión?"
        description="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados, incluyendo documentos y relaciones con comités."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Diálogo de asignación de usuario */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Expresión</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Seleccione un usuario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nombre} {user.apellido} ({user.email})
                      {currentUser && user.id === currentUser.id ? " (Tú)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignUser} disabled={isAssigning} className="bg-[#1a365d] hover:bg-[#15294d]">
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cambio de color */}
      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar color de asignación</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="color">Seleccione un color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[0, 30, 60, 120, 180, 210, 240, 270, 300, 330].map((hue) => (
                  <button
                    key={hue}
                    className={`size-8 rounded-full cursor-pointer border-2 ${
                      selectedColor === `hsl(${hue}, 70%, 90%)` ? "border-black" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${hue}, 70%, 90%)` }}
                    onClick={() => setSelectedColor(`hsl(${hue}, 70%, 90%)`)}
                    aria-label={`Color ${hue}`}
                  />
                ))}
                <button
                  className={`size-8 rounded-full cursor-pointer border-2 ${
                    selectedColor === "" ? "border-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: "#f1f5f9" }}
                  onClick={() => setSelectedColor("")}
                  aria-label="Color por defecto"
                >
                  <span className="text-gray-400 text-xs">Auto</span>
                </button>
              </div>
              <div className="mt-4">
                <div
                  className="px-4 py-2 rounded-full text-sm font-medium w-fit mx-auto"
                  style={{
                    backgroundColor:
                      selectedColor ||
                      `hsl(${expressionToChangeColor?.assigned_to_name?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 || 0}, 70%, 90%)`,
                    color: selectedColor
                      ? `hsl(${selectedColor.match(/\d+/)?.[0] || 0}, 70%, 30%)`
                      : `hsl(${expressionToChangeColor?.assigned_to_name?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 || 0}, 70%, 30%)`,
                    border: selectedColor
                      ? `1px solid hsl(${selectedColor.match(/\d+/)?.[0] || 0}, 70%, 80%)`
                      : `1px solid hsl(${expressionToChangeColor?.assigned_to_name?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 || 0}, 70%, 80%)`,
                  }}
                >
                  {expressionToChangeColor?.assigned_to_name || "Usuario"}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsColorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveColorChange} className="bg-[#1a365d] hover:bg-[#15294d]">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
