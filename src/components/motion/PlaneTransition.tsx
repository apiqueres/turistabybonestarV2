"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { isMobile, onLoaded, prefersReducedMotion } from "@/lib/motion";

/** Top-view airplane glyph, nose pointing up, 24×24 box. */
const PLANE =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";

/**
 * A small plane crosses the screen every time the user reaches a new section
 * (IntersectionObserver at 30 %), alternating direction and altitude, leaving a
 * dotted trail that fades behind it. On the hero it flies once after the loader.
 */
export function PlaneTransition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const maskRef = useRef<SVGPathElement>(null);
  const maskBoxRef = useRef<SVGMaskElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const state = useRef<{ current: number; tween: gsap.core.Tween | null }>({ current: -1, tween: null });
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const svg = svgRef.current;
    const trail = trailRef.current;
    const mask = maskRef.current;
    const maskBox = maskBoxRef.current;
    const plane = planeRef.current;
    if (!svg || !trail || !mask || !maskBox || !plane) return;

    const fly = (index: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const ltr = index % 2 === 0;
      const yStart = H * (0.2 + ((index * 0.17) % 0.5));
      const climb = index % 3 === 1 ? -1 : 1;
      const yEnd = yStart - H * 0.14 * climb;
      const x0 = ltr ? -80 : W + 80;
      const x1 = ltr ? W + 80 : -80;
      const c1x = ltr ? W * 0.3 : W * 0.7;
      const c2x = ltr ? W * 0.7 : W * 0.3;
      const d = `M ${x0} ${yStart} C ${c1x} ${yStart - H * 0.1 * climb}, ${c2x} ${yEnd + H * 0.08 * climb}, ${x1} ${yEnd}`;

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      maskBox.setAttribute("width", String(W + 400));
      maskBox.setAttribute("height", String(H + 400));
      trail.setAttribute("d", d);
      mask.setAttribute("d", d);
      const len = mask.getTotalLength();
      mask.style.strokeDasharray = `${len}`;
      mask.style.strokeDashoffset = `${len}`;

      state.current.tween?.kill();
      gsap.set(trail, { opacity: 1 });
      gsap.set(plane, { opacity: 1 });

      const prog = { p: 0 };
      state.current.tween = gsap.to(prog, {
        p: 1,
        duration: isMobile() ? 1.2 : 1.6,
        ease: "power2.out",
        onUpdate: () => {
          const l = prog.p * len;
          const pt = mask.getPointAtLength(l);
          const ahead = mask.getPointAtLength(Math.min(len, l + 2));
          const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
          plane.setAttribute(
            "transform",
            `translate(${pt.x} ${pt.y}) rotate(${angle + 90}) scale(1.15) translate(-12 -12)`,
          );
          mask.style.strokeDashoffset = `${len - l}`;
        },
        onComplete: () => {
          gsap.set(plane, { opacity: 0 });
          gsap.to(trail, { opacity: 0, duration: 0.8, ease: "power2.out" });
        },
      });
    };

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.3) return;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index === state.current.current) return;
          state.current.current = index;
          if (index > 0) fly(index);
        });
      },
      { threshold: [0.3] },
    );
    sections.forEach((s) => io.observe(s));

    // First load only: wait for the loader, then cross the hero once. Route changes use the orbit veil.
    state.current.current = 0;
    const off = firstRun.current ? onLoaded(() => fly(0)) : () => {};
    firstRun.current = false;

    // Other components (the wizard) can request a flight: window.dispatchEvent(new CustomEvent("tb:fly", { detail: n }))
    const onFly = (e: Event) => fly(Number((e as CustomEvent).detail ?? 1));
    window.addEventListener("tb:fly", onFly);

    const st = state.current;
    return () => {
      io.disconnect();
      off();
      window.removeEventListener("tb:fly", onFly);
      st.tween?.kill();
    };
  }, [pathname]);

  return (
    <svg ref={svgRef} className="plane-layer" aria-hidden preserveAspectRatio="none">
      <defs>
        <mask ref={maskBoxRef} id="tb-trail-mask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="4000" height="3000">
          <path ref={maskRef} fill="none" stroke="#fff" strokeWidth="8" />
        </mask>
      </defs>
      <path
        ref={trailRef}
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 9"
        mask="url(#tb-trail-mask)"
        opacity="0"
      />
      <g ref={planeRef} opacity="0">
        <path d={PLANE} fill="var(--accent)" />
      </g>
    </svg>
  );
}
