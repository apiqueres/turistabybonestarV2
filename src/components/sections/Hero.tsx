"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { gsap } from "@/lib/gsap";
import { onLoaded, prefersReducedMotion } from "@/lib/motion";
import { ArrowRight } from "@/components/ui/icons";

export function Hero({ data }: { data: SiteContent["home"]["hero"] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll(".hero-el");
    if (prefersReducedMotion()) {
      gsap.set(els, { opacity: 1 });
      return;
    }
    let tween: gsap.core.Tween | undefined;
    const off = onLoaded(() => {
      tween = gsap.fromTo(
        els,
        { opacity: 0, y: 40, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out", stagger: 0.12, delay: 0.2 },
      );
    });
    return () => {
      off();
      tween?.kill();
    };
  }, []);

  return (
    <section id="inicio" ref={ref} data-section className="section" style={{ borderTop: 0 }}>
      <video className="hero-video" autoPlay muted loop playsInline poster={data.video.poster} preload="metadata">
        <source src={data.video.mp4} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(11,15,16,0.45) 0%, rgba(11,15,16,0.35) 50%, rgba(11,15,16,0.75) 100%)",
        }}
      />
      <div className="relative gutter min-h-[100svh] flex flex-col items-center justify-center text-center pt-[var(--nav-h)] on-dark">
        <div className="hero-el kicker">{data.kicker}</div>
        <h1 className="t-hero hero-el mt-4">{data.word}</h1>
        <p className="hero-el mt-8 max-w-[56ch] text-[17px] leading-[1.6] t-body">
          {data.subtitle[0]}
          <br />
          {data.subtitle[1]}
        </p>
        <div className="hero-el mt-10 flex flex-col sm:flex-row items-center gap-6">
          <Link href={data.primary.href} className="btn btn-primary">
            {data.primary.label}
          </Link>
          <Link href={data.secondary.href} className="link-arrow t-small">
            {data.secondary.label}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
