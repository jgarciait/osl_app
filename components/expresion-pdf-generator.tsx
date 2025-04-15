import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Función para generar el PDF
export const generateExpresionPDF = async (expresion, documentos = [], comites = []) => {
  // Crear un nuevo documento PDF
  const doc = new jsPDF()

  // Configuración de la fuente
  doc.setFont("helvetica", "normal")

  // Márgenes
  const margin = 15

  // Función para añadir texto con formato
  const addFormattedText = (y, label, text) => {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const textWidth = 180 // Ancho máximo para el texto
    const textLines = doc.splitTextToSize(text || "N/A", textWidth)
    let currentY = y + 7

    textLines.forEach((line) => {
      doc.text(line, margin, currentY)
      currentY += 5
    })

    return currentY
  }

  let currentY = margin + 10

  // Título del documento
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(`Expresión Ciudadana: ${expresion?.numero || "N/A"}`, margin, currentY)
  currentY += 15

  // Información del ciudadano
  doc.setFontSize(12)
  currentY = addFormattedText(currentY, "Nombre:", expresion?.nombre)
  currentY = addFormattedText(currentY, "Email:", expresion?.email)
  currentY = addFormattedText(currentY, "Teléfono:", expresion?.telefono)

  // Información de la expresión
  currentY = addFormattedText(
    currentY,
    "Fecha de Recibo:",
    expresion?.fecha_recibido ? format(new Date(expresion.fecha_recibido), "PPP", { locale: es }) : "N/A",
  )
  currentY = addFormattedText(currentY, "Tema:", expresion?.tema_nombre)
  currentY = addFormattedText(currentY, "Trámite:", expresion?.tramite)
  currentY = addFormattedText(currentY, "Notas:", expresion?.notas)

  // Comités relacionados
  if (comites && comites.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Comités Referidos:", margin, currentY)
    currentY += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    comites.forEach((comite) => {
      doc.text(`- ${comite.nombre} (${comite.tipo})`, margin, currentY)
      currentY += 5
    })
  }

  // Documentos adjuntos
  if (documentos && documentos.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Documentos Adjuntos:", margin, currentY)
    currentY += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    documentos.forEach((documento) => {
      doc.text(`- ${documento.nombre}`, margin, currentY)
      currentY += 5
    })
  }

  // Contenido de la expresión
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Contenido:", margin, currentY)
  currentY += 7

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const contentText = doc.splitTextToSize(expresion?.propuesta || "N/A", 180)
  contentText.forEach((line) => {
    doc.text(line, margin, currentY)
    currentY += 5
  })

  // Guardar el PDF
  doc.save(`expresion_${expresion?.numero || "N/A"}.pdf`)
}
