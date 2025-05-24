export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string) {
    performance.mark(`${label}-start`)
  }

  endTiming(label: string) {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)

    const measure = performance.getEntriesByName(label)[0]
    if (measure) {
      const existing = this.metrics.get(label) || []
      existing.push(measure.duration)
      this.metrics.set(label, existing)

      // Log if over threshold
      if (measure.duration > 100) {
        console.warn(`[PERF] Slow operation: ${label} took ${measure.duration.toFixed(2)}ms`)
      }
    }
  }

  getMetrics() {
    const summary: Record<string, { avg: number; max: number; count: number }> = {}

    this.metrics.forEach((values, label) => {
      summary[label] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        count: values.length,
      }
    })

    return summary
  }

  measureNetworkRequests() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes("supabase")) {
          console.log(`[NETWORK] ${entry.name} - ${entry.duration.toFixed(2)}ms`)
        }
      })
    })

    observer.observe({ entryTypes: ["resource"] })
    return observer
  }
}

export const perf = PerformanceMonitor.getInstance()
