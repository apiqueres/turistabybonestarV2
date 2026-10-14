"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Offer } from "@/types/content";
import { ArrowRight, Close } from "@/components/ui/icons";
import { usePersistedState } from "@/lib/storage";

/** Id de la promoción que el visitante cerró: una promo distinta vuelve a mostrarse. */
const KEY = "tb:promo-cerrada";
/** Velocidad de la marquesina, en píxeles por segundo. */
const SPEED = 60;

/** Barra cian bajo la cabecera con la oferta marcada como promoción, con el texto en marquesina. Solo en la portada. */
export function PromoBar({ offer }: { offer: Offer | null }) {
  const pathname = usePathname();
  // Hasta hidratar se queda cerrada: así no parpadea si ya la habían cerrado.
  const [closed, setClosed, hydrated] = usePersistedState<string | null>(KEY, null);

  if (!offer || pathname !== "/") return null;

  const open = hydrated && closed !== offer.id;
  const text = offer.promoText || `${offer.title} · desde ${offer.price}`;

  return (
    <div className={`promo ${open ? "is-open" : ""}`} role="region" aria-label="Promoción" aria-hidden={!open}>
      <Marquee text={text} />
      <Link href={`/ofertas#oferta-${offer.id}`} className="promo-link" tabIndex={open ? 0 : -1}>
        Ver oferta <ArrowRight width={14} height={14} />
      </Link>
      <button type="button" className="promo-close" aria-label="Cerrar aviso" onClick={() => setClosed(offer.id)} tabIndex={open ? 0 : -1}>
        <Close width={16} height={16} />
      </button>
    </div>
  );
}

/**
 * Texto que se desplaza en bucle, como un rótulo de televisión. Se repite las veces necesarias
 * para cubrir el ancho visible dos veces: la animación recorre la primera mitad y empalma con
 * la segunda, idéntica, sin salto. La duración mantiene la velocidad constante sea cual sea el texto.
 */
function Marquee({ text }: { text: string }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(2);
  const [duration, setDuration] = useState(20);

  useEffect(() => {
    const el = box.current;
    const one = probe.current;
    if (!el || !one) return;
    const measure = () => {
      const unit = one.getBoundingClientRect().width; // una copia, con su separación
      if (!unit) return;
      const perHalf = Math.max(1, Math.ceil(el.clientWidth / unit));
      setCopies(perHalf * 2);
      setDuration(Math.max(8, (perHalf * unit) / SPEED));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={box} className="promo-marquee">
      <div className="promo-track" style={{ "--promo-dur": `${duration}s` } as React.CSSProperties}>
        {Array.from({ length: copies }, (_, i) => (
          <span key={i} ref={i === 0 ? probe : undefined} aria-hidden={i > 0}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
