-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_destinationId_fkey";

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "destination" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "destinationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("slug") ON DELETE SET NULL ON UPDATE CASCADE;


-- Relleno: el texto del destino parte del nombre del destino enlazado hasta ahora.
UPDATE "Offer" o SET "destination" = d."name" FROM "Destination" d WHERE o."destinationId" = d."slug" AND o."destination" = '';
