"use client";

import { useRef } from "react";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";

export function Table({ data }: { data: SiteContent["home"]["table"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="mesa" ref={ref} data-section className="section section--alt">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter min-h-[100svh] flex flex-col justify-center">
        <ScrubHeading lines={data.statement} className="t-h2 max-w-[22ch]" />
        <div className="rule mt-16 pt-12 cols-2">
          <blockquote className="md:pr-16 t-lines" data-reveal>
            «{data.quote}»
          </blockquote>
          <div className="md:pl-16 pt-8 md:pt-0 flex flex-col justify-end" data-reveal>
            <div className="uppercase tracking-[0.14em] t-small">{data.author}</div>
            <div className="t-small t-muted mt-1">{data.meta}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
