import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.initEthereal();
  }

  private async initEthereal() {
    // Cuenta de prueba Ethereal generada automáticamente para desarrollo
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        this.logger.error('Error creando cuenta Ethereal: ' + err.message);
        return;
      }
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
      this.logger.log(`Ethereal Email configurado: ${account.user}`);
    });
  }

  async sendUrgentAlert(to: string, empresaNombre: string, asunto: string) {
    if (!this.transporter) {
      this.logger.warn('Transporter no inicializado aún');
      return;
    }

    const info = await this.transporter.sendMail({
      from: '"BES Alertas" <alertas@bes.com>',
      to,
      subject: `⚠️ URGENTE: Nueva Notificación SUNAT - ${empresaNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ff4444; border-radius: 8px;">
          <h2 style="color: #ff4444;">Alerta Urgente SUNAT</h2>
          <p>Estimado usuario, el robot de BES ha detectado una notificación de alta prioridad para la empresa <strong>${empresaNombre}</strong>.</p>
          <p><strong>Asunto del documento:</strong> ${asunto}</p>
          <p>Por favor, inicie sesión en su panel de BES para revisar el documento PDF inmediatamente y evitar multas o embargos.</p>
          <br/>
          <a href="http://localhost:3001/dashboard" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en BES Panel</a>
        </div>
      `,
    });

    this.logger.log(`Mensaje urgente enviado a ${to}. URL Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
