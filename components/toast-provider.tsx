"use client"

import { Toaster as SonnerToaster } from "sonner"

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "my-toast",
      }}
    />
  )
}
