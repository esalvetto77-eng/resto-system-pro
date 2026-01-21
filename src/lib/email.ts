// Utilidades para envío de emails
import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    password: string
  }
}

/**
 * Crear transporter de nodemailer con configuración de Gmail
 */
function createTransporter() {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD

  if (!emailUser || !emailPassword) {
    throw new Error('EMAIL_USER y EMAIL_PASSWORD deben estar configurados en variables de entorno')
  }

  const config: EmailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true para puerto 465, false para otros
    auth: {
      user: emailUser,
      password: emailPassword,
    },
  }

  return nodemailer.createTransport(config)
}

/**
 * Enviar email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<void> {
  try {
    const transporter = createTransporter()
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER

    const mailOptions = {
      from: `"Sistema de Gestión" <${fromEmail}>`,
      to,
      subject: 'Recuperación de Contraseña - Sistema de Gestión',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px;">
            <h1 style="color: #8B4513; margin-top: 0;">Recuperación de Contraseña</h1>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Si solicitaste este cambio, haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              O copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #8B4513; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              <strong>Este enlace expirará en 1 hora.</strong>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no será modificada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin-bottom: 0;">
              Este es un email automático, por favor no respondas.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Recuperación de Contraseña - Sistema de Gestión

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Si solicitaste este cambio, visita el siguiente enlace para crear una nueva contraseña:

${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no será modificada.

Este es un email automático, por favor no respondas.
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log('[EMAIL] Email de recuperación enviado a:', to)
  } catch (error) {
    console.error('[EMAIL] Error al enviar email de recuperación:', error)
    throw new Error('Error al enviar email de recuperación')
  }
}

/**
 * Verificar configuración de email
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    (process.env.EMAIL_FROM || process.env.EMAIL_USER)
  )
}

/**
 * Obtener lista de emails autorizados para recuperación de contraseña
 * Solo estos emails pueden solicitar recuperación
 */
export function getAllowedRecoveryEmails(): string[] {
  // Obtener de variable de entorno (separados por comas)
  const allowedEmailsEnv = process.env.ALLOWED_PASSWORD_RECOVERY_EMAILS || ''
  
  if (!allowedEmailsEnv) {
    // Si no está configurado, retornar array vacío (nadie puede recuperar)
    console.warn('[EMAIL] ALLOWED_PASSWORD_RECOVERY_EMAILS no configurado - recuperación deshabilitada')
    return []
  }

  // Separar por comas, limpiar espacios y convertir a minúsculas
  const emails = allowedEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)

  return emails
}
