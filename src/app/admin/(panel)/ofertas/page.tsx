import { OffersDb, OffersDemo } from "@/components/admin/sources";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { listDestinations } from "@/lib/repo/destinos";
import { listOffers } from "@/lib/repo/ofertas";

export default async function OffersPage() {
  if (STATIC_DEMO) return <OffersDemo />;
  await requireUser();
  const [offers, destinations] = await Promise.all([listOffers({ all: true }), listDestinations({ all: true })]);
  return <OffersDb initial={offers} destinations={destinations} />;
}
