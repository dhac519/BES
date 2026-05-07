/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `Notificacion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "estadoSincro" TEXT NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "ultimaSincronizacion" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notificacion" ADD COLUMN     "fileId" TEXT,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'NOTIFICACION';

-- CreateIndex
CREATE UNIQUE INDEX "Notificacion_fileId_key" ON "Notificacion"("fileId");
