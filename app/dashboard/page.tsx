"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardCharts } from "@/components/dashboard-charts"
import { InteractiveGraph } from "@/components/interactive-graph"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("charts")

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 gap-2">
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="graph">Vista de Grafo</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-4">
              <DashboardCharts />
            </TabsContent>

            <TabsContent value="graph" className="container space-y-4">
              <InteractiveGraph />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
