import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />
      <div className="w-full py-6 px-4">
        <DashboardCharts />
      </div>
    </>
  )
}
