import { DebugPermissionsSchema } from "@/components/debug-permissions-schema"

export default function DebugSchemaPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Schema Debug</h1>
      <DebugPermissionsSchema />
    </div>
  )
}
