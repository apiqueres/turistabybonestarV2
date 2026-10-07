"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { BASE_PATH, asset } from "@/lib/config";

/** Top-view airplane glyph, nose pointing up, 24×24 box. */
const PLANE =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";
const W = 600, H = 400, CX = 300, CY = 200, RX = 230, RY = 78;
const ORBIT = `M ${CX - RX} ${CY} a ${RX} ${RY} 0 1 0 ${RX * 2} 0 a ${RX} ${RY} 0 1 0 ${-RX * 2} 0`;
const FADE_IN = 0.35, ORBIT_T = 1.3, MIN_HOLD = 1.35, FADE_OUT = 0.45;

type Mode = { kind: "route"; started: number } | { kind: "hold" };

/**
 * Black veil with the plane orbiting the logo (the brand's own swoosh).
 * Used for click-driven route changes and, via `window.dispatchEvent(new CustomEvent("tb:veil", { detail: { hold } }))`,
 * as a "processing" screen (e.g. while the wizard is being sent).
 */
export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const veil = useRef<HTMLDivElement>(null);
  const plane = useRef<SVGGElement>(null);
  const mask = useRef<SVGPathElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const mode = useRef<Mode | null>(null);

  const show = useCallback(() => {
    setActive(true);
    requestAnimationFrame(() => {
      const el = veil.current, p = plane.current, m = mask.current;
      if (!el || !p || !m) return;
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: FADE_IN, ease: "power2.out" });
      const len = m.getTotalLength();
      const tail = len * 0.28;
      m.style.strokeDasharray = `${tail} ${len}`;
      const prog = { t: 0 };
      tween.current?.kill();
      tween.current = gsap.to(prog, {
        t: 1,
        duration: ORBIT_T,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          const l = prog.t * len;
          const pt = m.getPointAtLength(l);
          const ahead = m.getPointAtLength((l + 2) % len);
          const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
          p.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${angle + 90}) scale(1.5) translate(-12 -12)`);
          m.style.strokeDashoffset = `${tail - l}`;
        },
      });
    });
  }, []);

  const hide = useCallback(() => {
    const el = veil.current;
    const done = () => {
      tween.current?.kill();
      tween.current = null;
      mode.current = null;
      setActive(false);
    };
    if (!el) return done();
    gsap.to(el, { opacity: 0, duration: FADE_OUT, ease: "power2.inOut", onComplete: done });
  }, []);

  const start = useCallback(
    (target: string) => {
      if (mode.current) return;
      mode.current = { kind: "route", started: performance.now() };
      show();
      window.setTimeout(() => router.push(target), FADE_IN * 1000);
    },
    [router, show],
  );

  // Intercept internal link clicks.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page (anchor or reload)
      if (mode.current) return;
      const path = BASE_PATH && url.pathname.startsWith(BASE_PATH) ? url.pathname.slice(BASE_PATH.length) || "/" : url.pathname;
      // The admin panel navigates plainly: no veil between its sections.
      if (path.startsWith("/admin") && window.location.pathname.includes("/admin")) return;
      e.preventDefault();
      start(path + url.search + url.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // "Processing" mode requested by other components.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onVeil = (e: Event) => {
      if (mode.current) return;
      const hold = Number((e as CustomEvent).detail?.hold ?? 2000);
      mode.current = { kind: "hold" };
      show();
      window.setTimeout(hide, hold);
    };
    window.addEventListener("tb:veil", onVeil);
    return () => window.removeEventListener("tb:veil", onVeil);
  }, [show, hide]);

  // New route rendered: hold until the orbit is done, then fade out.
  useEffect(() => {
    const m = mode.current;
    if (!m || m.kind !== "route") return;
    const elapsed = (performance.now() - m.started) / 1000;
    const t = window.setTimeout(hide, Math.max(0, MIN_HOLD - elapsed) * 1000);
    return () => window.clearTimeout(t);
  }, [pathname, hide]);

  // Safety: never leave the veil on screen if navigation stalls.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      if (mode.current?.kind === "route") hide();
    }, 3000);
    return () => window.clearTimeout(t);
  }, [active, hide]);

  if (!active) return null;
  return (
    <div ref={veil} className="route-veil" aria-hidden>
      <div className="route-veil-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/brand/logo-white-512.png")} alt="" className="route-veil-logo" />
        <svg viewBox={`0 0 ${W} ${H}`} className="route-veil-svg">
          <defs>
            <mask id="tb-orbit-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <path ref={mask} d={ORBIT} fill="none" stroke="#fff" strokeWidth="8" transform={`rotate(-18 ${CX} ${CY})`} />
            </mask>
          </defs>
          <g transform={`rotate(-18 ${CX} ${CY})`}>
            <path d={ORBIT} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <path d={ORBIT} fill="none" stroke="#fff" strokeOpacity="0.95" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 8" mask="url(#tb-orbit-mask)" />
            <g ref={plane}>
              <path d={PLANE} fill="var(--accent)" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
