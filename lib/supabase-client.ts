import { createBrowserClient } from "@supabase/ssr"

// Creamos una variable para almacenar la instancia del cliente
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientClient() {
  // En desarrollo, siempre creamos una nueva instancia para evitar problemas con HMR
  if (process.env.NODE_ENV === "development" || !supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    )
  }

  return supabaseClient
}

// Función para manejar errores de autenticación
export async function handleAuthError(error: any) {
  console.error("Error de autenticación:", error)

  // Si es un error de token no encontrado, intentamos limpiar la sesión
  if (error?.code === "refresh_token_not_found" || error?.message?.includes("refresh token")) {
    const supabase = createClientClient()

    // Intentar cerrar sesión para limpiar tokens
    try {
      await supabase.auth.signOut()
      console.log("Sesión cerrada debido a token inválido")
    } catch (signOutError) {
      console.error("Error al cerrar sesión:", signOutError)
    }

    // Limpiar cualquier token almacenado localmente
    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase.auth.token")
    }

    // Redirigir al login si estamos en el cliente
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }
}

/**
 * Realiza una consulta a Supabase con caché en memoria
 * @param key Clave única para identificar la consulta en caché
 * @param queryFn Función que realiza la consulta a Supabase
 * @param ttl Tiempo de vida de la caché en milisegundos (default: 60000ms = 1min)
 */
export const cachedQuery = (() => {
  const cache = new Map()

  return async (key, queryFn, ttl = 60000) => {
    const now = Date.now()
    const cachedItem = cache.get(key)

    if (cachedItem && now - cachedItem.timestamp < ttl) {
      return cachedItem.data
    }

    const result = await queryFn()

    if (!result.error) {
      cache.set(key, {
        data: result,
        timestamp: now,
      })
    }

    return result
  }
})()
