"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import type { Offer } from "@/types/content";
import { useOffers } from "@/lib/admin/data";
import { asset, STATIC_DEMO } from "@/lib/config";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ArrowRight } from "@/components/ui/icons";

interface Props {
  content: SiteContent["offers"];
  /** Ofertas del servidor (base de datos). En la demo estática se usan las editadas en el navegador. */
  offers: Offer[];
  communityHref: string;
}

const src = (s: string) => (s.startsWith("data:") ? s : asset(s));

/** Seasonal offers in the same layout as the featured destinations, with prices. */
export function OffersGrid({ content, offers: serverOffers, communityHref }: Props) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);
  const demo = useOffers();
  const offers = STATIC_DEMO ? demo.offers : serverOffers;
  const hydrated = STATIC_DEMO ? demo.hydrated : true;
  const active = offers.filter((o) => o.active);

  return (
    <>
      <section ref={ref} data-section className="section">
        <SectionLabel name={content.kicker} />
        <div className="section-inner gutter">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-14">
            <ScrubHeading as="h1" lines={content.title} className="t-h2" />
            <p className="t-body max-w-[44ch]" data-reveal>
              {content.text}
            </p>
          </div>
          {hydrated && active.length === 0 ? (
            <p className="t-body rule pt-8">{content.empty}</p>
          ) : (
            <div className="dest-grid" data-cascade>
              {active.map((o) => (
                <article key={o.id} id={`oferta-${o.id}`} className="card dest-card" data-cascade-item>
                  <div className="media" style={{ aspectRatio: "4 / 3" }}>
                    <div className="media-inner">
                      {o.image.src.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.image.src} alt={o.image.alt} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <Image src={src(o.image.src)} alt={o.image.alt} fill sizes="(max-width: 900px) 100vw, 33vw" className="object-cover" />
                      )}
                    </div>
                  </div>
                  <div className="pt-6 pb-8 md:px-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="t-h3">{o.title}</h2>
                      {o.badge && <span className="badge offer-badge whitespace-nowrap">{o.badge}</span>}
                    </div>
                    <div>
                      <div className="offer-price">{o.price}</div>
                      <div className="kicker mt-2">{o.priceNote}</div>
                    </div>
                    <p className="t-body t-small">{o.text}</p>
                    <ul className="t-body t-small flex flex-col gap-1">
                      {o.includes.map((i) => (
                        <li key={i} className="flex gap-3"><span className="t-muted">—</span>{i}</li>
                      ))}
                    </ul>
                    <div className="flex items-baseline justify-between gap-4 kicker">
                      <span>{o.dates}</span>
                      <span>{o.duration}</span>
                    </div>
                    <Link href={`/donde-nos-vamos?pais=${o.destinationId}`} className="btn btn-primary btn-sm self-start mt-2">
                      {content.cta}
                      <ArrowRight className="btn-icon" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <section data-section className="section section--short section--alt">
        <div className="gutter py-16 cols-2">
          <div className="md:pr-16">
            <div className="kicker">{content.community.kicker}</div>
            <h2 className="t-h2 mt-4 max-w-[18ch]">{content.community.title}</h2>
          </div>
          <div className="md:pl-16 pt-8 md:pt-0 flex flex-col justify-between gap-8">
            <p className="t-body text-[17px] max-w-[46ch]">{content.community.text}</p>
            <a href={communityHref} target="_blank" rel="noreferrer" className="btn btn-primary self-start">
              {content.community.cta}
              <ArrowRight className="btn-icon" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
