"use server"

import { createServerClient as createClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { unstable_noStore as noStore } from "next/cache"

// Creamos una función que devuelve una nueva instancia del cliente en cada llamada
// para evitar problemas con el almacenamiento en caché entre solicitudes
export async function createServerClient() {
  noStore()
  const cookieStore = cookies()

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignorar errores de cookies en modo de solo lectura
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Ignorar errores de cookies en modo de solo lectura
        }
      },
    },
  })
}

export const createClientClient = createServerClient
