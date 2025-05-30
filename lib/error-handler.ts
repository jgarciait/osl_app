// Simple and effective ResizeObserver error suppression
export function setupGlobalErrorHandler() {
  if (typeof window !== "undefined") {
    // Suppress ResizeObserver errors globally
    const originalError = console.error
    console.error = (...args) => {
      if (args.length > 0 && typeof args[0] === "string" && args[0].includes("ResizeObserver loop")) {
        // Silently ignore ResizeObserver loop errors
        return
      }
      originalError.apply(console, args)
    }

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      if (event.message?.includes("ResizeObserver loop") || event.error?.message?.includes("ResizeObserver loop")) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      if (
        event.reason?.message?.includes("ResizeObserver loop") ||
        String(event.reason).includes("ResizeObserver loop")
      ) {
        event.preventDefault()
        return false
      }
    })
  }
}
