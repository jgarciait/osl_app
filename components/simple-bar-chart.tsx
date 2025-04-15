"use client"

interface BarChartData {
  nombre: string
  activas: number
  archivadas: number
  total: number
}

interface SimpleBarChartProps {
  data: BarChartData[]
  height?: number
}

// Modificar la función para limitar la altura de las barras y evitar que sobresalgan
export function SimpleBarChart({ data, height = 350 }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>No hay datos disponibles para mostrar</p>
      </div>
    )
  }

  // Encontrar el valor máximo para escalar las barras
  const maxValue = Math.max(...data.map((item) => Math.max(item.activas, item.archivadas)))

  // Calcular la escala (altura máxima de barra en píxeles)
  const maxBarHeight = height - 100 // Aumentar el espacio para evitar desbordamiento
  const scale = maxValue > 0 ? maxBarHeight / maxValue : 0

  return (
    <div className="w-full h-full">
      <div className="flex justify-end mb-2 gap-2 sm:gap-4">
        <div className="flex items-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#1a365d] mr-1 sm:mr-2"></div>
          <span className="text-xs sm:text-sm">Activas</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#94a3b8] mr-1 sm:mr-2"></div>
          <span className="text-xs sm:text-sm">Archivadas</span>
        </div>
      </div>

      <div className="flex items-end justify-around h-[calc(100%-30px)] border-b border-l relative overflow-hidden">
        {/* Líneas de guía horizontales */}
        <div className="absolute inset-0">
          <div className="border-t border-gray-100 absolute w-full" style={{ bottom: "25%" }}></div>
          <div className="border-t border-gray-100 absolute w-full" style={{ bottom: "50%" }}></div>
          <div className="border-t border-gray-100 absolute w-full" style={{ bottom: "75%" }}></div>
        </div>

        {data.map((item, index) => {
          // Calcular el total para este item
          const itemTotal = item.activas + item.archivadas
          // Calcular la altura total de la barra (limitada por maxBarHeight)
          const totalBarHeight = Math.min(itemTotal * scale, maxBarHeight)

          // Calcular las proporciones
          const activasProportion = itemTotal > 0 ? item.activas / itemTotal : 0
          const archivadasProportion = itemTotal > 0 ? item.archivadas / itemTotal : 0

          // Calcular las alturas basadas en la proporción
          const activasHeight = totalBarHeight * activasProportion
          const archivadasHeight = totalBarHeight * archivadasProportion

          return (
            <div
              key={index}
              className="flex flex-col items-center mx-0.5 sm:mx-1 w-full max-w-[40px] sm:max-w-[80px] relative z-10"
            >
              <div className="flex flex-col w-full items-center">
                {/* Barra combinada con degradado */}
                <div className="relative w-6 sm:w-12 rounded-t-md overflow-hidden group">
                  {/* Barra activas */}
                  {item.activas > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-[#1a365d] to-[#2563eb] relative"
                      style={{ height: `${activasHeight}px` }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] sm:text-xs px-1 py-0.5 rounded transition-opacity whitespace-nowrap">
                        {item.activas} activas ({Math.round(activasProportion * 100)}%)
                      </div>
                      {/* Mostrar la cantidad en lugar de la letra */}
                      <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                        {item.activas}
                      </div>
                    </div>
                  )}

                  {/* Barra archivadas (encima de activas) */}
                  {item.archivadas > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-[#94a3b8] to-[#cbd5e1] relative mt-0.5"
                      style={{
                        height: `${archivadasHeight}px`,
                        marginTop: item.activas > 0 ? "2px" : "0",
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] sm:text-xs px-1 py-0.5 rounded transition-opacity whitespace-nowrap">
                        {item.archivadas} archivadas ({Math.round(archivadasProportion * 100)}%)
                      </div>
                      {/* Mostrar la cantidad en lugar de la letra */}
                      <div className="absolute inset-0 flex items-center justify-center text-black text-[10px] sm:text-xs font-bold">
                        {item.archivadas}
                      </div>
                    </div>
                  )}

                  {/* Reflejo para efecto 3D */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-black opacity-10"></div>
                </div>
              </div>

              {/* Etiqueta del mes */}
              <div className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-center font-medium">{item.nombre}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
