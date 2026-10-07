"use client";

import { useRef } from "react";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";

/** "El dolor real": the reasons the owner never travels, and our answer. */
export function Pain({ data }: { data: SiteContent["home"]["pain"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="dolor" ref={ref} data-section className="section section--alt">
      <SectionLabel name={data.kicker} />
      <div className="section-inner gutter min-h-[100svh] flex flex-col justify-center">
        <ScrubHeading lines={data.statement} className="t-h2 max-w-[22ch]" />
        <div className="rule mt-14 pt-10 cols-2">
          <ul className="md:pr-16 flex flex-col" data-reveal-group>
            {data.items.map((item, i) => (
              <li key={item} className="rule-b py-5 flex gap-6 items-baseline" data-reveal>
                <span className="kicker shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-serif text-[26px] leading-[1.15]">{item}</span>
              </li>
            ))}
          </ul>
          <div className="md:pl-16 pt-10 md:pt-0 flex flex-col justify-between gap-10" data-reveal-group>
            <p className="t-body text-[18px] max-w-[42ch]" data-reveal>
              {data.answer}
            </p>
            <div data-reveal>
              <blockquote className="t-serif text-[28px] leading-[1.15]">«{data.quote}»</blockquote>
              <div className="kicker mt-5" style={{ color: "var(--ink)" }}>{data.author}</div>
              <div className="kicker mt-1">{data.meta}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
