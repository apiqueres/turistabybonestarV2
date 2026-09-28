"use client";

import { useRef } from "react";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ScrubHeading } from "@/components/motion/ScrubHeading";

export function Method({ data }: { data: SiteContent["home"]["method"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="metodo" ref={ref} data-section className="section">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter min-h-[100svh] flex flex-col justify-center">
        <div className="cols-3 rule">
          {data.steps.map((s) => (
            <div key={s.number} className="py-12 md:px-12 first:md:pl-0 last:md:pr-0">
              <div className="t-muted t-small">{s.number}</div>
              <ScrubHeading as="h3" lines={s.title} className="t-h2 mt-6" />
              <p className="t-body mt-8 max-w-[34ch]" data-reveal>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
