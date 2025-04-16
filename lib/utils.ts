import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Modificar la función generateExpressionNumber para usar la abreviatura del tema
export function generateExpressionNumber(year: number, sequence: number, suffix = "RNAR") {
  return `${year}-${sequence.toString().padStart(4, "0")}-${suffix}`
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Utility function to safely handle arrays
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : []
}

// Utility function to safely get a property from an object
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
  return obj && obj[key] !== undefined ? obj[key] : defaultValue
}
