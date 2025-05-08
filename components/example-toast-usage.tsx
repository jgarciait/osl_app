"use client"

import { useToastSafe } from "@/hooks/use-toast-safe"
import { Button } from "@/components/ui/button"

export function ExampleToastUsage() {
  const { toast } = useToastSafe()

  const handleClick = () => {
    toast({
      title: "Acción completada",
      description: "La operación se ha realizado con éxito",
      type: "success",
    })
  }

  return <Button onClick={handleClick}>Mostrar Toast</Button>
}
