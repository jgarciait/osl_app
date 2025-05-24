"use client"

import { memo } from "react"
import { ExpresionForm } from "./expresion-form"

// Simple memoized wrapper around the existing ExpresionForm
export const OptimizedExpresionForm = memo(ExpresionForm, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary rerenders
  return (
    prevProps.expresion?.id === nextProps.expresion?.id &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.comites?.length === nextProps.comites?.length &&
    prevProps.temas?.length === nextProps.temas?.length &&
    prevProps.clasificaciones?.length === nextProps.clasificaciones?.length &&
    JSON.stringify(prevProps.selectedComiteIds) === JSON.stringify(nextProps.selectedComiteIds) &&
    JSON.stringify(prevProps.selectedClasificacionIds) === JSON.stringify(nextProps.selectedClasificacionIds)
  )
})

OptimizedExpresionForm.displayName = "OptimizedExpresionForm"

// Also export the original for backward compatibility
export { ExpresionForm } from "./expresion-form"
