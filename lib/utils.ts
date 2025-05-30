import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a formatted expression number.
 * Example: For year 2024, temaCodigo "SALUD", sequence 1 -> "2024-SALUD-0001"
 * @param year The year of the expression.
 * @param temaCodigo The code of the topic.
 * @param sequence The sequence number.
 * @param padding The number of digits for the sequence (e.g., 4 for "0001").
 * @returns The formatted expression number string.
 */
export function generateExpressionNumber(
  year: number,
  temaCodigo: string,
  sequence: number,
  padding = 4, // Default padding to 4 digits
): string {
  if (!year || !temaCodigo || sequence === undefined || sequence === null) {
    // Return a placeholder or empty string if essential parts are missing
    // This helps prevent errors if called with incomplete data during form initialization
    return ""
  }
  const sequenceString = String(sequence).padStart(padding, "0")
  return `${year}-${temaCodigo.toUpperCase()}-${sequenceString}`
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
