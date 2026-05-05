import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('scraper')
export class ScraperController {
  constructor(
    @InjectQueue('sunat-scraper-queue') private scraperQueue: Queue,
    private prisma: PrismaService
  ) {}

  @Post('sync/:empresaId')
  async syncEmpresa(@Param('empresaId') empresaId: string, @Request() req: any) {
    // Verificar que la empresa pertenezca al usuario autenticado
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, usuarioId: req.user.id }
    });

    if (!empresa) {
      throw new Error('Empresa no encontrada o no autorizada');
    }

    // Encolar el trabajo con alta prioridad
    await this.scraperQueue.add('scrape-sunat', { empresaId, usuarioId: req.user.id }, {
      priority: 1 // 1 es prioridad alta en BullMQ (menor número = mayor prioridad)
    });

    return { message: 'Sincronización encolada', status: 'pending' };
  }
}
