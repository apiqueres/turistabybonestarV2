"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Destination, SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ArrowRight } from "@/components/ui/icons";

interface Props {
  data: SiteContent["home"]["destinations"];
  items: Destination[];
}

export function DestinationsGrid({ data, items }: Props) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);
  const featured = items.filter((d) => d.featured).slice(0, 6);

  return (
    <section id="destinos" ref={ref} data-section className="section section--alt">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-14">
          <ScrubHeading lines={data.title} className="t-h2" />
          <Link href={data.link.href} className="link-arrow t-small" data-reveal>
            {data.link.label}
            <ArrowRight />
          </Link>
        </div>
        <div className="dest-grid" data-cascade>
          {featured.map((d) => (
            <Link key={d.id} href={`/donde-nos-vamos?pais=${d.id}`} className="card dest-card" data-cascade-item>
              <div className="media" data-parallax style={{ aspectRatio: "4 / 3" }}>
                <div className="media-inner">
                  <Image src={d.image.src} alt={d.image.alt} fill sizes="(max-width: 900px) 100vw, 33vw" className="object-cover" />
                </div>
              </div>
              <div className="pt-6 pb-8 md:px-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="t-h3">{d.name}</h3>
                  <span className="t-small t-muted whitespace-nowrap">{d.duration}</span>
                </div>
                <p className="t-body t-small mt-3 max-w-[38ch]">{d.tagline}</p>
                <div className="flex items-baseline justify-between gap-4 mt-6">
                  <span className="kicker">{d.region}</span>
                  {d.badge ? <span className="badge nueva">{d.badge}</span> : <span className="kicker">{d.idealFor}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
