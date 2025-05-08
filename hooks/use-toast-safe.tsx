"use client"

import { toast as sonnerToast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastOptions {
  title?: string
  description?: string
  type?: ToastType
  duration?: number
}

export function useToastSafe() {
  const toast = (options: ToastOptions) => {
    const { title, description, type = "info", duration = 4000 } = options

    const message = title ? (description ? `${title}: ${description}` : title) : description

    if (!message) return

    switch (type) {
      case "success":
        sonnerToast.success(message, { duration })
        break
      case "error":
        sonnerToast.error(message, { duration })
        break
      case "warning":
        sonnerToast.warning(message, { duration })
        break
      default:
        sonnerToast(message, { duration })
    }
  }

  return { toast }
}
