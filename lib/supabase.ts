// This file might have been inadvertently deleted or changed.
// It's common to re-export the client-side Supabase client for easier imports.
import { createClientClient } from "./supabase-client"

// Create and export the Supabase client instance
// This allows other parts of the application to import 'supabase' directly from '@/lib/supabase'
export const supabase = createClientClient()

// You can also re-export types or other utilities if needed
export type { SupabaseClient } from "@supabase/supabase-js"
