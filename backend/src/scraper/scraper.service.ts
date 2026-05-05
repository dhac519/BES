import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { MailService } from '../mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  private readonly proxies = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly mailService: MailService
  ) {}

  async checkBuzonForEmpresa(empresaId: string) {
    this.logger.log(`Iniciando revisión de buzón para la empresa ${empresaId}`);
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: { usuario: true }
    });

    if (!empresa) {
      throw new Error(`Empresa con ID ${empresaId} no encontrada.`);
    }

    const password = this.encryptionService.decrypt(empresa.claveSol);

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    });

    const page = await browser.newPage();

    try {
      this.logger.log(`Navegando a SUNAT para RUC ${empresa.ruc}`);
      const sunatPortalUrl = 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm';
      await page.goto(sunatPortalUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('#txtRuc', { timeout: 15000 });
      await page.type('#txtRuc', empresa.ruc);
      await page.type('#txtUsuario', empresa.usuarioSol);
      await page.type('#txtContrasena', password);
      await page.click('#btnAceptar');
      
      this.logger.log(`Esperando dashboard principal de SUNAT...`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      this.logger.log(`ESPERANDO 15 SEGUNDOS: Por favor, haz clic en "Buzón Mensajes"...`);
      await new Promise(r => setTimeout(r, 15000));
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      let notificacionesExtraidas: any[] = [];
      const notificacionesMap = new Map<string, any>();

      try {
        const framesList = page.frames();
        // FILTRO CRÍTICO: Solo procesar el frame que realmente contiene el buzón
        const mainFrame = framesList.find(f => f.url().includes('visor') || f.url().includes('master'));
        
        if (mainFrame) {
          this.logger.log(`Frame de buzón detectado: ${mainFrame.url()}`);
          await mainFrame.evaluate(() => { window.print = () => {}; });

          const dateElements = await mainFrame.$$('*');
          const uniqueContainers = new Set<any>();

          for (const el of dateElements) {
             const isDate = await el.evaluate((node) => {
                const text = (node as HTMLElement).innerText || "";
                return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/.test(text.trim()) && node.childNodes.length <= 1;
             });

             if (isDate) {
                const container = await el.evaluateHandle((node) => {
                   let p = node.parentElement;
                   while (p && p.tagName !== "TR" && p.tagName !== "LI" && !p.className.includes("row")) { p = p.parentElement; }
                   return p;
                });
                if (container) uniqueContainers.add(container);
             }
          }

          const containersArray = Array.from(uniqueContainers);
          this.logger.log(`Detectadas ${containersArray.length} filas reales en el frame principal.`);

          let lastFileId = "";
          for (const container of containersArray) {
             try {
                // Capturar el asunto directamente de la fila ANTES de hacer clic (es más fiable)
                const rowData = await (container as any).evaluate((node: HTMLElement) => {
                   return {
                      fullText: node.innerText,
                      asunto: node.querySelector('.asunto, [class*="asunto"], b, strong')?.textContent || node.innerText.split('\n')[0]
                   };
                });

                // Forzar scroll y clic agresivo
                await (container as any).evaluate((node: HTMLElement) => {
                   node.scrollIntoView();
                   const link = node.querySelector('a, span');
                   if (link) (link as HTMLElement).click();
                   node.click();
                });
                
                // Esperar a que el ID cambie realmente en el DOM (Polling)
                let currentId = "";
                for (let i = 0; i < 6; i++) {
                   await new Promise(r => setTimeout(r, 2000));
                   currentId = await mainFrame.evaluate(() => {
                      const match = document.body.innerHTML.match(/bajarArchivo\/(\d{9,12})/);
                      return match ? match[1] : "";
                   });
                   if (currentId && currentId !== lastFileId) break;
                }
                lastFileId = currentId;

                const data = await mainFrame.evaluate(() => {
                   const visor = document.querySelector('iframe[src*="visor"], #divDetalleMensaje, [id*="visor"], .constancia-container');
                   return {
                      text: document.body.innerText,
                      html: visor ? visor.outerHTML : document.body.innerHTML
                   };
                });

                const textBlock = data.text;
                const htmlBlock = data.html;
                const dateMatch = textBlock.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/) || rowData.fullText.match(/(\d{2}\/\d{2}\/\d{4})/);
                
                if (dateMatch) {
                   let asunto = rowData.asunto.trim();
                   if (!asunto.toUpperCase().includes('ASUNTO:')) asunto = `ASUNTO: ${asunto}`;
                   let tipoMensaje = asunto.toUpperCase().includes('NOTIFICACI') ? "NOTIFICACION" : "MENSAJE";
                   
                   let fechaMensaje = new Date();
                   if (dateMatch[1].includes(':')) {
                      const parts = dateMatch[1].split(/[\s\/:]/); 
                      fechaMensaje = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4]), parseInt(parts[5]));
                   } else {
                      const parts = dateMatch[1].split('/');
                      fechaMensaje = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                   }

                   let fileId = htmlBlock.match(/bajarArchivo\/(\d{9,12})/)?.[1] || htmlBlock.match(/_(\d{9,12})\s*\(/)?.[1];

                   let finalHref = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                   
                   if (fileId) {
                      const sunatDownloadUrl = `https://ww1.sunat.gob.pe/ol-ti-itvisornoti/visor/bajarArchivo/${fileId}/0/0/${empresa.ruc}`;
                      try {
                          this.logger.log(`Descargando PDF Real: ${fileId}...`);
                          const base64Data = await mainFrame.evaluate(async (url) => {
                             const res = await fetch(url);
                             const blob = await res.blob();
                             return new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                             });
                          }, sunatDownloadUrl);
                          
                          const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
                          fs.writeFileSync(path.join(uploadDir, `${fileId}.pdf`), buffer);
                          finalHref = `http://localhost:3000/uploads/${fileId}.pdf`;
                      } catch (e) {
                          this.logger.error(`Error en descarga: ${e.message}`);
                      }
                   }

                   if (tipoMensaje === "NOTIFICACION") {
                      const uniqueKey = fileId || `${asunto}-${dateMatch[1]}`;
                      if (!notificacionesMap.has(uniqueKey)) {
                         notificacionesMap.set(uniqueKey, {
                            empresaId: empresa.id,
                            asunto: asunto.length > 200 ? asunto.substring(0, 197) + '...' : asunto,
                            fechaMensaje,
                            tipo: tipoMensaje,
                            estado: 'NO_LEIDO',
                            rutaArchivoPdf: finalHref
                         });
                      }
                   }
                }
             } catch (err) {
                this.logger.warn(`Error procesando una fila: ${err.message}`);
             }
          }
        }
        notificacionesExtraidas = Array.from(notificacionesMap.values());
      } catch (domError) {
        this.logger.error('Fallo crítico en extracción:', domError);
      }

      if (notificacionesExtraidas.length > 0) {
          await this.prisma.notificacion.deleteMany({ where: { empresaId: empresa.id } });
          await this.prisma.notificacion.createMany({ data: notificacionesExtraidas });
          this.logger.log(`Guardadas ${notificacionesExtraidas.length} notificaciones.`);
      }

      for (const notif of notificacionesExtraidas) {
        if (notif.asunto.toLowerCase().includes("orden de pago") || notif.asunto.toLowerCase().includes("esquela")) {
          await this.mailService.sendUrgentAlert(empresa.usuario.email, empresa.razonSocial, notif.asunto);
        }
      }

      this.logger.log(`Revisión completada para RUC ${empresa.ruc}`);
    } catch (error) {
      this.logger.error(`Error durante el scraping:`, error);
      throw error;
    } finally {
      await new Promise(r => setTimeout(r, 5000));
      if (browser) await browser.close();
    }
  }
}
