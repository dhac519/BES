-- CreateEnum
CREATE TYPE "EstadoConexion" AS ENUM ('CONECTADO', 'REQUIERE_ACTUALIZACION', 'ERROR_SISTEMA');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "estadoConexion" "EstadoConexion" NOT NULL DEFAULT 'CONECTADO';
