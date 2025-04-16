import { createServerClient } from "@/lib/supabase-server"

// Utility function for safe Supabase data fetching
export async function safeSupabaseFetch(tableName: string, selectQuery = "*") {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from(tableName).select(selectQuery)

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`Error in safeSupabaseFetch for ${tableName}:`, error)
    return []
  }
}

// Utility function for fetching multiple datasets
export async function fetchMultipleDatasets(queries: { tableName: string; selectQuery?: string }[]) {
  try {
    const results = await Promise.all(
      queries.map(async ({ tableName, selectQuery }) => {
        return {
          tableName,
          data: await safeSupabaseFetch(tableName, selectQuery),
        }
      }),
    )

    // Convert the array of results into an object
    const data = results.reduce((acc, { tableName, data }) => {
      acc[tableName] = data
      return acc
    }, {})

    return data
  } catch (error) {
    console.error("Error in fetchMultipleDatasets:", error)
    return {}
  }
}
