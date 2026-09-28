"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ArrowRight } from "@/components/ui/icons";

export function Closing({ data }: { data: SiteContent["home"]["closing"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  return (
    <section id="cierre" ref={ref} data-section className="section">
      <div className="media media-fill" data-parallax>
        <Image src={data.image.src} alt={data.image.alt} fill sizes="100vw" className="object-cover" />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(11,15,16,0.9) 0%, rgba(11,15,16,0.45) 45%, rgba(11,15,16,0.1) 100%)" }}
      />
      <SectionLabel name={data.kicker} tone="light" />
      <div className="relative section-inner gutter min-h-[100svh] flex flex-col md:flex-row md:items-end md:justify-between gap-10 on-dark">
        <ScrubHeading lines={data.title} className="t-h2" />
        <div className="flex flex-col sm:flex-row gap-4" data-reveal-group>
          <Link href={data.primary.href} className="btn btn-primary" data-reveal>
            {data.primary.label}
            <ArrowRight className="btn-icon" />
          </Link>
          <Link href={data.secondary.href} className="btn btn-secondary" data-reveal>
            {data.secondary.label}
            <ArrowRight className="btn-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
