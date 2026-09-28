"use client";

import { useRef } from "react";
import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { SectionLabel } from "@/components/layout/SectionLabel";

export function Dimensions({ data }: { data: SiteContent["home"]["dimensions"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="preguntamos" ref={ref} data-section className="section section--short">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter cols-2">
        <div className="md:pr-16">
          <p className="t-body max-w-[36ch] text-[17px]" data-reveal>
            {data.text}
          </p>
        </div>
        <div className="md:pl-16 pt-8 md:pt-0 flex flex-wrap gap-3" data-reveal-group>
          {data.items.map((d) => (
            <Link key={d.label} href={`/como-viajas?paso=${d.step}`} className="chip" data-reveal>
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
