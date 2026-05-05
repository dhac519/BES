import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  findAllByUser(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: {
        empresa: {
          usuarioId: usuarioId
        }
      },
      include: {
        empresa: {
          select: { razonSocial: true, ruc: true }
        }
      },
      orderBy: {
        fechaMensaje: 'desc'
      }
    });
  }

  markAsRead(id: string, usuarioId: string) {
    // Nota: Deberíamos asegurar que el usuarioId coincida antes de actualizar
    return this.prisma.notificacion.update({
      where: { id },
      data: { estado: 'LEIDO' }
    });
  }

  async removeAllByUser(usuarioId: string) {
    // Buscar empresas del usuario para borrar sus notificaciones
    const empresas = await this.prisma.empresa.findMany({
      where: { usuarioId },
      select: { id: true }
    });
    
    const empresaIds = empresas.map(e => e.id);
    
    return this.prisma.notificacion.deleteMany({
      where: {
        empresaId: { in: empresaIds }
      }
    });
  }
}
