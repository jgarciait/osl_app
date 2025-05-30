import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { template, email } = await request.json()

    if (!template || !email) {
      return NextResponse.json({ error: "Template y email son requeridos" }, { status: 400 })
    }

    // Custom email templates with aqplatform.app domain
    const templates = {
      reset_password: {
        subject: "Restablecimiento de contraseña - Sistema de Expresiones Legislativas",
        content: `
          <h2>Solicitud de restablecimiento de contraseña</h2>
          <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta.</p>
          <p>Haga clic en el siguiente enlace para establecer una nueva contraseña:</p>
          <p>
            <a href="https://aqplatform.app/reset-password/confirm?token_hash={{.TokenHash}}&type=recovery"
               style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;line-height:1;text-decoration:none;color:#ffffff;background:#2da44e;border-radius:6px;">
              Restablecer Contraseña
            </a>
          </p>
          <p>Si no solicitó este cambio, puede ignorar este correo electrónico.</p>
          <p>Este enlace expirará en 24 horas.</p>
        `,
      },
      // Add other templates as needed
    }

    const selectedTemplate = templates[template as keyof typeof templates]

    if (!selectedTemplate) {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 400 })
    }

    // For testing purposes, we'll just return the template
    // In production, you would integrate with an email service
    return NextResponse.json({
      success: true,
      template: selectedTemplate,
      message: "Plantilla generada correctamente",
    })
  } catch (error: any) {
    console.error("Error generating email template:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
