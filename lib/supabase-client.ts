import { createClientComponentClient as createSupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Creamos una variable para almacenar la instancia del cliente
const supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const createClientComponentClient = () => {
  return createSupabaseClient<Database>()
}

// Add this function to maintain compatibility with existing code
export function createClientClient() {
  return createClientComponentClient()
}

// Función para manejar errores de autenticación
export const handleAuthError = async (error: any) => {
  console.error("Auth error:", error)
  if (error.status === 401) {
    window.location.href = "/login"
  }
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>()
const CACHE_DURATION = 1000 // 1 second

/**
 * Realiza una consulta a Supabase con caché en memoria
 * @param key Clave única para identificar la consulta en caché
 * @param queryFn Función que realiza la consulta a Supabase
 * @param cacheDuration Tiempo de vida de la caché en milisegundos (default: 1000ms = 1s)
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  cacheDuration = CACHE_DURATION,
): Promise<T> {
  const cacheKey = `query_${key}_${Date.now() - (Date.now() % cacheDuration)}`

  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)
  }

  const promise = queryFn()
  requestCache.set(cacheKey, promise)

  // Clean up cache after duration
  setTimeout(() => {
    requestCache.delete(cacheKey)
  }, cacheDuration)

  return promise
}
