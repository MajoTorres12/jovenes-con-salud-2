import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal.pass'
  }
})

export const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
  const mailOptions = {
    from: `"Jóvenes con Salud" <${process.env.SMTP_FROM || 'no-reply@jovenesconsalud.org'}>`,
    to: toEmail,
    subject: 'Recuperación de Contraseña - Jóvenes con Salud',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Jóvenes con Salud</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700;">Recuperación de Cuenta</span>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Hola, <strong>${name}</strong>:
        </p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          Hemos recibido una solicitud para restablecer la contraseña asociada a esta cuenta de correo. Si no fuiste tú, puedes ignorar este mensaje de forma segura.
        </p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
          Para establecer una nueva contraseña, haz clic en el siguiente botón. Este enlace tiene una **validez de 1 hora**:
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">Restablecer mi Contraseña</a>
        </div>
        
        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 30px;">
          Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador web:
          <br />
          <a href="${resetLink}" style="color: #38bdf8; word-break: break-all;">${resetLink}</a>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 35px 0;" />
        
        <div style="text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Instituto de la Juventud del Estado de Tamaulipas</p>
          <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    `
  }

  // If no SMTP host is configured in the environment variables, we print a mock console output
  if (!process.env.SMTP_HOST) {
    console.log('\n======================================================')
    console.log('✉ [MOCK EMAIL SENT]')
    console.log(`To: ${toEmail}`)
    console.log(`Reset Link: ${resetLink}`)
    console.log('======================================================\n')
  }

  return transporter.sendMail(mailOptions)
}
