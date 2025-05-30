import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorHandlerProvider } from "@/components/error-handler-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sistema de Expresiones Legislativas",
  description: "Sistema para gestionar expresiones legislativas de ciudadanos",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorHandlerProvider>
          <ErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              {children}
              <ToastProvider />
            </ThemeProvider>
          </ErrorBoundary>
        </ErrorHandlerProvider>
      </body>
    </html>
  )
}
