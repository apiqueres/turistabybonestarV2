import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { SiteShell } from "@/components/layout/SiteShell";
import { OffersGrid } from "@/components/sections/OffersGrid";

export const metadata: Metadata = { title: "Ofertas" };

export default async function OffersPage() {
  const { offers, brand } = await getSiteContent();
  const digits = brand.whatsapp.replace(/\D/g, "");
  const communityHref = brand.communityUrl || `https://wa.me/${digits}?text=${encodeURIComponent(`Hola, quiero unirme a la comunidad «${brand.communityName}» y recibir el itinerario gratuito.`)}`;
  return (
    <SiteShell>
      <OffersGrid content={offers} communityHref={communityHref} />
    </SiteShell>
  );
}
