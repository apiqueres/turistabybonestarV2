-- AlterTable
ALTER TABLE "Contacto" ADD COLUMN     "handledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "closedAt" TIMESTAMP(3);


-- Relleno: lo ya cerrado o atendido toma como referencia su fecha de creación (plazo más corto, nunca más largo).
UPDATE "Solicitud" SET "closedAt" = "createdAt" WHERE "status" = 'cerrada' AND "closedAt" IS NULL;
UPDATE "Contacto" SET "handledAt" = "createdAt" WHERE "handled" = true AND "handledAt" IS NULL;
