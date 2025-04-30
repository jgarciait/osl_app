import { createClientClient } from "@/lib/supabase-client"

/**
 * Registra una acción en el audit trail
 * @param userId ID del usuario que realiza la acción
 * @param action Descripción de la acción realizada
 * @returns Promise con el resultado de la inserción
 */
export async function logAuditTrail(userId: string, action: string) {
  try {
    const supabase = createClientClient()

    const { data, error } = await supabase.from("audit_trail_expresiones").insert({
      user_id: userId,
      action: action,
    })

    if (error) {
      console.error("Error al registrar en el audit trail:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error inesperado al registrar en el audit trail:", error)
    return { success: false, error }
  }
}
