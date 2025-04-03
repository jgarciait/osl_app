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

export function generateExpressionNumber(year: number, sequence: number, suffix = "RNAR") {
  return `${year}-${sequence.toString().padStart(4, "0")}-${suffix}`
}

