"use client"

import React from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Filter out ResizeObserver errors
    if (error.message?.includes("ResizeObserver loop")) {
      console.debug("ResizeObserver error caught and ignored in ErrorBoundary")
      return { hasError: false }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Don't log ResizeObserver errors
    if (error.message?.includes("ResizeObserver loop")) {
      return
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Algo salió mal</h2>
          <p className="text-sm text-gray-600 mb-4">Ha ocurrido un error inesperado.</p>
          <button onClick={this.resetError} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Intentar de nuevo
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
