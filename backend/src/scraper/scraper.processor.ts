import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { EventsGateway } from '../events/events.gateway';

@Processor('sunat-scraper-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly eventsGateway: EventsGateway
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { empresaId, usuarioId } = job.data;
    this.logger.log(`Procesando tarea de scraping para la empresa ${empresaId}...`);
    try {
      await this.scraperService.checkBuzonForEmpresa(empresaId);
      this.logger.log(`Tarea completada exitosamente para la empresa ${empresaId}.`);
      
      // Emitir éxito si hay un usuarioId asociado
      if (usuarioId) {
        this.eventsGateway.emitToUser(usuarioId, 'sync-finished', { empresaId, status: 'success' });
      }
    } catch (error: any) {
      this.logger.error(`Falló la tarea de scraping para la empresa ${empresaId}`, error.stack);
      
      // Emitir error si hay un usuarioId asociado
      if (usuarioId) {
        this.eventsGateway.emitToUser(usuarioId, 'sync-error', { empresaId, status: 'error', message: error.message });
      }
      throw error;
    }
  }
}
