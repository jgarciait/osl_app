import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export const createClientClient = () => {
  return createBrowserClient<Database>(
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

// Añadir esta función para mantener compatibilidad con el código existente
export function createServerClient() {
  return createClientClient()
}

export const handleAuthError = async (error: any) => {
  console.error("Auth error:", error)
  if (error.status === 401) {
    // Redirigir a la página de login si hay un error de autenticación
    window.location.href = "/login"
  }
}

const cachedQuery = null // Or define a proper implementation/import

export { cachedQuery }
