"use client"

import type React from "react"

import { useEffect } from "react"
import { setupGlobalErrorHandler } from "@/lib/error-handler"

export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up error handling immediately
    setupGlobalErrorHandler()

    // Additional ResizeObserver error suppression
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  return <>{children}</>
}
