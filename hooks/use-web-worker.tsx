"use client"

import { useEffect, useRef, useState } from "react"

export function useWebWorker(workerPath: string) {
  const workerRef = useRef<Worker>()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      workerRef.current = new Worker(workerPath)

      workerRef.current.onmessage = (e) => {
        // Handle messages from worker
        console.log("Worker message:", e.data)
      }

      setIsReady(true)
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [workerPath])

  const postMessage = (message: any) => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage(message)
    }
  }

  return { postMessage, isReady }
}
