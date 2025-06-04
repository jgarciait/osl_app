import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateExpressionNumber(year: number, sequence: number, temaCodigo?: string): string {
  // Ensure temaCodigo is a string and provide fallback
  const codigo = typeof temaCodigo === "string" && temaCodigo.trim() ? temaCodigo.trim().toUpperCase() : "RNAR"

  // Ensure sequence is a valid number
  const validSequence = typeof sequence === "number" && !isNaN(sequence) ? sequence : 1

  // Ensure year is a valid number
  const validYear = typeof year === "number" && !isNaN(year) ? year : new Date().getFullYear()

  // Format sequence with leading zeros (4 digits)
  const sequenceStr = validSequence.toString().padStart(4, "0")

  return `${validYear}-${sequenceStr}-${codigo}`
}

/**
 * Debounce function
 * Delays invoking a function until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @param immediate If true, trigger the function on the leading edge, instead of the trailing.
 * @returns A debounced version of the function.
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number,
  immediate = false,
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null
  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}
