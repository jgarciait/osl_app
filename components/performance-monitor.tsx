"use client"

import { useEffect } from "react"

interface PerformanceMonitorProps {
  pageName: string
}

export function PerformanceMonitor({ pageName }: PerformanceMonitorProps) {
  useEffect(() => {
    // Monitor network requests
    const originalFetch = window.fetch
    let requestCount = 0
    const requestUrls = new Set<string>()

    window.fetch = async (...args) => {
      requestCount++
      const url = args[0]?.toString() || "unknown"
      requestUrls.add(url)

      if (requestCount > 20) {
        console.warn(`[Performance] Too many requests (${requestCount}) on ${pageName}`)
        console.warn("Unique URLs:", Array.from(requestUrls))
      }

      return originalFetch(...args)
    }

    // Monitor long tasks
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[Performance] Long task detected: ${entry.duration}ms on ${pageName}`)
          }
        }
      })
      observer.observe({ entryTypes: ["longtask"] })

      return () => {
        observer.disconnect()
        window.fetch = originalFetch
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [pageName])

  return null
}
