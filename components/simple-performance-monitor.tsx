"use client"

import { useEffect, useRef } from "react"

export function SimplePerformanceMonitor({ pageName }: { pageName: string }) {
  const requestCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    // Monitor fetch requests
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      requestCount.current++
      const url = args[0]?.toString() || ""

      if (url.includes("supabase")) {
        console.log(`[NETWORK] Request #${requestCount.current}: ${url.split("?")[0]}`)

        if (requestCount.current > 20) {
          console.warn(`[PERFORMANCE] Too many requests (${requestCount.current}) on ${pageName}`)
        }
      }

      return originalFetch(...args)
    }

    return () => {
      window.fetch = originalFetch
      const totalTime = Date.now() - startTime.current
      console.log(`[PERFORMANCE] ${pageName} total time: ${totalTime}ms, requests: ${requestCount.current}`)
    }
  }, [pageName])

  return null
}
