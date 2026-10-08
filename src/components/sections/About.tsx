"use client";

import { useRef } from "react";
import Image from "next/image";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";

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
            <div className="media" data-parallax style={{ aspectRatio: "4 / 3", maxWidth: 480 }}>
              <Image src={data.image.src} alt={data.image.alt} fill sizes="(max-width: 900px) 100vw, 480px" className="object-cover" />
            </div>
          </div>
          <div className="md:pl-16 pt-10 md:pt-0" data-reveal-group>
            <p className="t-body max-w-[52ch] text-[17px]" data-reveal>
              {data.paragraph}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
