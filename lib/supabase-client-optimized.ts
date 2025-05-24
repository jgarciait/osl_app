import { createBrowserClient } from "@supabase/ssr"

// Simple in-memory cache for GET requests
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 1000 // 30 seconds

function getCacheKey(table: string, query: any): string {
  return `${table}:${JSON.stringify(query)}`
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL
}

export function createOptimizedClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Wrap the from method to add caching
  const originalFrom = supabase.from.bind(supabase)

  supabase.from = (table: string) => {
    const queryBuilder = originalFrom(table)
    const originalSelect = queryBuilder.select.bind(queryBuilder)

    queryBuilder.select = (columns?: string, options?: any) => {
      const selectBuilder = originalSelect(columns, options)
      const originalExecute = selectBuilder.then.bind(selectBuilder)

      // Override the promise execution to add caching
      selectBuilder.then = (onFulfilled?: any, onRejected?: any) => {
        const query = {
          table,
          columns,
          options,
          // Add other query parameters as they're chained
        }

        const cacheKey = getCacheKey(table, query)
        const cached = queryCache.get(cacheKey)

        if (cached && isCacheValid(cached.timestamp)) {
          console.log(`[CACHE] Using cached data for: ${cacheKey}`)
          return Promise.resolve(cached.data).then(onFulfilled, onRejected)
        }

        console.log(`[CACHE] Fetching fresh data for: ${cacheKey}`)
        return originalExecute(onFulfilled, onRejected).then((result: any) => {
          // Cache successful results
          if (result && !result.error) {
            queryCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            })
          }
          return result
        })
      }

      return selectBuilder
    }

    return queryBuilder
  }

  return supabase
}

export const supabaseOptimized = createOptimizedClient()
