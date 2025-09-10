import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    console.log('EMAIL_USER:', process.env.EMAIL_USER); // Para debug
    console.log('EMAIL_PASS definido:', !!process.env.EMAIL_PASS); // Para debug
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'notificacionesplat@gmail.com',
        pass: process.env.EMAIL_PASS || 'plat2025*'
      }
    });
  }

  /**
   * Verifica la configuración del transportador
   */
  async verificarConexion() {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de email configurado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de email:', error);
      return false;
    }
  }

  /**
   * Envía email de recuperación de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} nombres - Nombre del usuario
   * @param {string} token - Token de recuperación
   */
  async enviarRecuperacionPassword(email, nombres, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-password?token=${token}`;
      
      const mailOptions = {
        from: {
          name: 'PLAT-EPA - Soporte Técnico',
          address: process.env.EMAIL_USER || 'notificacionesplat@gmail.com'
        },
        to: email,
        subject: '🔐 Recuperación de Contraseña - PLAT-EPA',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏢 PLAT-EPA</h1>
                <p>Plataforma de Apoyo TIC</p>
              </div>
              
              <div class="content">
                <h2>Hola ${nombres},</h2>
                
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en PLAT-EPA.</p>
                
                <p>Si solicitaste este cambio, haz clic en el siguiente botón para crear una nueva contraseña:</p>
                
                <center>
                  <a href="${resetUrl}" class="button">🔐 Restablecer Contraseña</a>
                </center>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul>
                    <li>Este enlace expirará en <strong>1 hora</strong></li>
                    <li>Solo se puede usar una vez</li>
                    <li>Si no solicitaste este cambio, ignora este email</li>
                  </ul>
                </div>
                
                <p>Por tu seguridad, nunca compartas este enlace con nadie.</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático de PLAT-EPA - No responder</p>
                <p>© 2025 Empresas Públicas de Armenia E.S.P. - Dirección TIC</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de recuperación enviado:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error al enviar email de recuperación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} nombres - Nombre del usuario
   */
  async enviarConfirmacionCambioPassword(email, nombres) {
    try {
      const mailOptions = {
        from: {
          name: 'PLAT-EPA - Soporte Técnico',
          address: process.env.EMAIL_USER || 'notificacionesplat@gmail.com'
        },
        to: email,
        subject: '✅ Contraseña Actualizada - PLAT-EPA',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d1edff; border: 1px solid #74b9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .security-tip { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏢 PLAT-EPA</h1>
                <p>Plataforma de Apoyo TIC</p>
              </div>
              
              <div class="content">
                <h2>Hola ${nombres},</h2>
                
                <div class="success">
                  <h3>✅ Contraseña actualizada con éxito</h3>
                  <p>Tu contraseña ha sido cambiada correctamente el día <strong>${new Date().toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</strong></p>
                </div>
                
                <p>Si realizaste este cambio, puedes ignorar este mensaje. Tu cuenta está segura.</p>
                
                <div class="security-tip">
                  <strong>🛡️ Consejos de seguridad:</strong>
                  <ul>
                    <li>No compartas tu contraseña con nadie</li>
                    <li>Usa contraseñas únicas para cada cuenta</li>
                    <li>Cierra sesión al terminar de usar el sistema</li>
                  </ul>
                </div>
                
                <p><strong>⚠️ ¿No fuiste tú?</strong></p>
                <p>Si no realizaste este cambio, contacta inmediatamente al administrador del sistema o al equipo de soporte técnico.</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático de PLAT-EPA - No responder</p>
                <p>© 2025 Empresas Públicas de Armenia E.S.P. - Dirección TIC</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de confirmación enviado:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error al enviar email de confirmación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía email de bienvenida a nuevo usuario
   * @param {string} email - Email del destinatario
   * @param {string} nombres - Nombre del usuario
   * @param {string} nombreUsuario - Username del usuario
   */
  async enviarBienvenida(email, nombres, nombreUsuario) {
    try {
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const mailOptions = {
        from: {
          name: 'PLAT-EPA - Soporte Técnico',
          address: process.env.EMAIL_USER || 'notificacionesplat@gmail.com'
        },
        to: email,
        subject: '🎉 Bienvenido a PLAT-EPA',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #6c5ce7; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .info-box { background: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Bienvenido a PLAT-EPA!</h1>
                <p>Plataforma de Apoyo TIC</p>
              </div>
              
              <div class="content">
                <h2>Hola ${nombres},</h2>
                
                <p>¡Bienvenido a la Plataforma de Apoyo TIC de Empresas Públicas de Armenia E.S.P.!</p>
                
                <p>Tu cuenta ha sido creada exitosamente con los siguientes datos:</p>
                
                <div class="info-box">
                  <strong>📧 Email:</strong> ${email}<br>
                  <strong>👤 Usuario:</strong> ${nombreUsuario}<br>
                  <strong>📅 Fecha de registro:</strong> ${new Date().toLocaleDateString('es-CO')}
                </div>
                
                <p>Con PLAT-EPA podrás:</p>
                <ul>
                  <li>🎫 Crear y gestionar tickets de soporte técnico</li>
                  <li>💻 Consultar el inventario de equipos</li>
                  <li>📚 Acceder a la base de conocimientos</li>
                  <li>📊 Ver reportes y análisis</li>
                </ul>
                
                <center>
                  <a href="${loginUrl}" class="button">🚀 Acceder a PLAT-EPA</a>
                </center>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte técnico.</p>
                
                <p>¡Esperamos que tengas una excelente experiencia usando nuestra plataforma! 😊</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático de PLAT-EPA - No responder</p>
                <p>© 2025 Empresas Públicas de Armenia E.S.P. - Dirección TIC</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida enviado:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error al enviar email de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

    /**
   * Envía email de activación de cuenta con código
   * @param {string} email - Email del destinatario
   * @param {string} nombres - Nombre del usuario
   * @param {string} codigoActivacion - Código de 6 dígitos para activar la cuenta
   */
  async enviarActivacionCuenta(email, nombres, codigoActivacion) {
    try {
      const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-account`;
      
      const mailOptions = {
        from: {
          name: 'PLAT-EPA - Soporte Técnico',
          address: process.env.EMAIL_USER || 'notificacionesplat@gmail.com'
        },
        to: email,
        subject: '🔐 Activa tu cuenta - PLAT-EPA',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .code-box { background: #e8f4f8; border: 2px solid #667eea; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
              .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏢 PLAT-EPA</h1>
                <p>Plataforma de Apoyo TIC</p>
              </div>
              
              <div class="content">
                <h2>¡Hola ${nombres}! 👋</h2>
                
                <p>¡Bienvenido a PLAT-EPA! Tu cuenta ha sido creada exitosamente, pero necesitas activarla antes de poder usarla.</p>
                
                <p>Para activar tu cuenta, usa el siguiente código de activación:</p>
                
                <div class="code-box">
                  <p style="margin: 0; font-size: 18px; color: #666;">Código de Activación:</p>
                  <div class="code">${codigoActivacion}</div>
                </div>
                
                <center>
                  <a href="${activationUrl}" class="button">🚀 Activar mi Cuenta</a>
                </center>
                
                <p>También puedes acceder directamente a:</p>
                <p style="background: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all;">
                  ${activationUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Información importante:</strong>
                  <ul>
                    <li>Este código es válido por <strong>24 horas</strong></li>
                    <li>Solo se puede usar una vez</li>
                    <li>Si no activaste esta cuenta, ignora este email</li>
                    <li>El código es: <strong>${codigoActivacion}</strong></li>
                  </ul>
                </div>
                
                <h3>¿Qué puedes hacer con PLAT-EPA? 🎯</h3>
                <ul>
                  <li>🎫 Crear y gestionar tickets de soporte técnico</li>
                  <li>💻 Consultar el inventario de equipos</li>
                  <li>📚 Acceder a la base de conocimientos</li>
                  <li>📊 Ver reportes y análisis</li>
                </ul>
                
                <p>Una vez actives tu cuenta, podrás acceder a todas estas funcionalidades.</p>
                
                <p>Si tienes problemas para activar tu cuenta o necesitas ayuda, contacta al administrador del sistema.</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático de PLAT-EPA - No responder</p>
                <p>© 2025 Empresas Públicas de Armenia E.S.P. - Dirección TIC</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de activación enviado:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error al enviar email de activación:', error);
      return { success: false, error: error.message };
    }
  }
}



// Exportar instancia única del servicio
export default new EmailService();