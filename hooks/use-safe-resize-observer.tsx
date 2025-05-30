"use client"

import type React from "react"

import { useEffect, useRef } from "react"

export function useSafeResizeObserver<T extends Element>(
  callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void,
  deps: React.DependencyList = [],
) {
  const elementRef = useRef<T>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Debounce the callback to prevent rapid successive calls
    let timeoutId: NodeJS.Timeout
    const debouncedCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        try {
          callback(entries, observer)
        } catch (error) {
          // Silently handle ResizeObserver loop errors
          if (error instanceof Error && error.message.includes("ResizeObserver loop")) {
            console.debug("ResizeObserver loop detected and handled")
            return
          }
          console.error("ResizeObserver error:", error)
        }
      }, 0)
    }

    try {
      observerRef.current = new ResizeObserver(debouncedCallback)
      observerRef.current.observe(element)
    } catch (error) {
      console.error("Failed to create ResizeObserver:", error)
    }

    return () => {
      clearTimeout(timeoutId)
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [callback, ...deps])

  return elementRef
}
