"use client"

import { useCallback, useRef } from "react"

export function useDebouncedHandlers() {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedSearch = useCallback((searchFn: (query: string) => void, delay = 300) => {
    return (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        searchFn(query)
      }, delay)
    }
  }, [])

  const throttledScroll = useCallback((scrollFn: () => void, delay = 100) => {
    let lastCall = 0

    return () => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        scrollFn()
      }
    }
  }, [])

  return { debouncedSearch, throttledScroll }
}
