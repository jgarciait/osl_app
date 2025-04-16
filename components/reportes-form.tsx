"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function ReportesForm({ years = [], comites = [] }) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    comite: "",
    fechaInicio: null,
    fechaFin: null,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date, fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Lógica para generar el reporte
    console.log("Generando reporte con:", formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Reporte</CardTitle>
        <CardDescription>Seleccione los criterios para generar el reporte</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <Select
              value={formData.year}
              onValueChange={(value) => handleInputChange({ target: { name: "year", value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comite">Comité</Label>
            <Select
              value={formData.comite}
              onValueChange={(value) => handleInputChange({ target: { name: "comite", value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione comité" />
              </SelectTrigger>
              <SelectContent>
                {comites.map((comite) => (
                  <SelectItem key={comite.id} value={comite.id}>
                    {comite.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fechaInicio ? (
                      format(formData.fechaInicio, "PPP", { locale: es })
                    ) : (
                      <span>Seleccione fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fechaInicio}
                    onSelect={(date) => handleDateChange(date, "fechaInicio")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fechaFin ? (
                      format(formData.fechaFin, "PPP", { locale: es })
                    ) : (
                      <span>Seleccione fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fechaFin}
                    onSelect={(date) => handleDateChange(date, "fechaFin")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-[#1a365d] hover:bg-[#15294d]" type="submit">
            Generar Reporte
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
