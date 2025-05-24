"use client"

import { useRef, useCallback } from "react"

type RequestCache = {
  [key: string]: {
    promise: Promise<any>
    timestamp: number
  }
}

const DEDUP_TTL = 1000 // 1 second

export function useRequestDeduplication() {
  const cache = useRef<RequestCache>({})

  const deduplicateRequest = useCallback(async (key: string, requestFn: () => Promise<any>): Promise<any> => {
    const now = Date.now()

    // Check if we have a recent request for this key
    if (cache.current[key] && now - cache.current[key].timestamp < DEDUP_TTL) {
      console.log(`[DEDUP] Using cached request for: ${key}`)
      return cache.current[key].promise
    }

    // Create new request
    console.log(`[DEDUP] Making new request for: ${key}`)
    const promise = requestFn()

    // Cache the promise
    cache.current[key] = {
      promise,
      timestamp: now,
    }

    // Clean up cache entry after completion
    promise.finally(() => {
      setTimeout(() => {
        delete cache.current[key]
      }, DEDUP_TTL)
    })

    return promise
  }, [])

  return { deduplicateRequest }
}
