-- Promoción de portada: una oferta marcada y su texto de barra (opcional).
ALTER TABLE "Offer" ADD COLUMN "promo" BOOLEAN NOT NULL DEFAULT false,
                    ADD COLUMN "promoText" TEXT;
