export const PERFORMANCE_BUDGET = {
  // Network
  maxNetworkRequests: 20,
  maxTTFB: 200, // ms
  maxLCP: 2500, // ms
  maxCLS: 0.1,

  // JavaScript
  maxMainThreadBlocking: 50, // ms
  maxComponentRenderTime: 16, // ms (60fps)

  // Memory
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB

  // Database
  maxQueryTime: 100, // ms
  maxQueriesPerPage: 5,
}

export function measurePagePerformance() {
  return new Promise((resolve) => {
    // Wait for page to be fully loaded
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        const resources = performance.getEntriesByType("resource")

        const metrics = {
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          networkRequests: resources.length,
          supabaseRequests: resources.filter((r) => r.name.includes("supabase")).length,
          blobRequests: resources.filter((r) => r.name.includes("blob:")).length,
        }

        // Check against budget
        const violations = []
        if (metrics.ttfb > PERFORMANCE_BUDGET.maxTTFB) {
          violations.push(`TTFB: ${metrics.ttfb}ms > ${PERFORMANCE_BUDGET.maxTTFB}ms`)
        }
        if (metrics.networkRequests > PERFORMANCE_BUDGET.maxNetworkRequests) {
          violations.push(`Network requests: ${metrics.networkRequests} > ${PERFORMANCE_BUDGET.maxNetworkRequests}`)
        }

        resolve({ metrics, violations })
      }, 1000)
    })
  })
}
