-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'gestor');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bccSelf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gmailAppPass" TEXT,
ADD COLUMN     "gmailUser" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'gestor';

-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "from" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sentById" TEXT;

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "MessageLog_sentById_idx" ON "MessageLog"("sentById");

-- CreateIndex
CREATE INDEX "Solicitud_assignedToId_idx" ON "Solicitud"("assignedToId");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
