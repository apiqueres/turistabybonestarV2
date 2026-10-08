"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Offer } from "@/types/content";
import { ArrowRight, Close } from "@/components/ui/icons";
import { usePersistedState } from "@/lib/storage";

/** Id de la promoción que el visitante cerró: una promo distinta vuelve a mostrarse. */
const KEY = "tb:promo-cerrada";

/** Barra dorada bajo la cabecera con la oferta marcada como promoción. Solo en la portada. */
export function PromoBar({ offer }: { offer: Offer | null }) {
  const pathname = usePathname();
  // Hasta hidratar se queda cerrada: así no parpadea si ya la habían cerrado.
  const [closed, setClosed, hydrated] = usePersistedState<string | null>(KEY, null);

  if (!offer || pathname !== "/") return null;

  const open = hydrated && closed !== offer.id;
  const text = offer.promoText || `${offer.title} · desde ${offer.price}`;

  return (
    <div className={`promo ${open ? "is-open" : ""}`} role="region" aria-label="Promoción" aria-hidden={!open}>
      <span className="promo-text">{text}</span>
      <Link href={`/ofertas#oferta-${offer.id}`} className="promo-link" tabIndex={open ? 0 : -1}>
        Ver oferta <ArrowRight width={14} height={14} />
      </Link>
      <button type="button" className="promo-close" aria-label="Cerrar aviso" onClick={() => setClosed(offer.id)} tabIndex={open ? 0 : -1}>
        <Close width={16} height={16} />
      </button>
    </div>
  );
}
