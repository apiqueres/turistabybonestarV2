"use client";

import { useRef } from "react";
import Image from "next/image";
import type { SiteContent, Stat } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";

function BigStat({ stat }: { stat: Stat }) {
  return (
    <div>
      <div className="t-stat">
        <span data-counter={stat.value}>{stat.value.toLocaleString("es-ES")}</span>
        {stat.suffix}
      </div>
      <div className="t-muted t-small mt-3">{stat.label}</div>
    </div>
  );
}

export function About({ data }: { data: SiteContent["home"]["about"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="nosotros" ref={ref} data-section className="section">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter">
        <ScrubHeading lines={data.title} className="t-h2 max-w-[16ch]" />
        <div className="t-small t-muted uppercase tracking-[0.14em] mt-6 mb-14" data-reveal>
          {data.meta}
        </div>
        <div className="cols-2">
          <div className="md:pr-16">
            <div className="media" data-parallax style={{ aspectRatio: "4 / 5" }}>
              <Image src={data.image.src} alt={data.image.alt} fill sizes="(max-width: 900px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
          <div className="md:pl-16 pt-10 md:pt-0 flex flex-col justify-between" data-reveal-group>
            <p className="t-body max-w-[52ch] text-[17px]" data-reveal>
              {data.paragraph}
            </p>
            <div className="mt-16">
              <div className="rule pt-10 flex gap-14" data-reveal>
                <BigStat stat={data.stats[0]} />
                <div className="v-rule pl-14">
                  <BigStat stat={data.stats[1]} />
                </div>
              </div>
              <div className="rule mt-10 pt-8 flex flex-wrap gap-x-10 gap-y-4" data-reveal>
                {data.partners.map((p) => (
                  <span key={p} className="partner">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
