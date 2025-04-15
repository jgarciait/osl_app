import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClientClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// Eliminar esta función para evitar la redeclaración
// export function createClient() {
//   return createClientClient()
// }

export const handleAuthError = async (error: any) => {
  console.error("Auth error:", error)
  if (error.status === 401) {
    // Redirigir a la página de login si hay un error de autenticación
    window.location.href = "/login"
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
