"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { BASE_PATH, asset } from "@/lib/config";

const FADE_IN = 0.2, MIN_HOLD = 1.15, FADE_OUT = 0.35;

type Mode = { kind: "route"; started: number } | { kind: "hold" };

/**
 * White veil between sections: the camera drops in, takes the picture (lens burst + flash) and the logo appears.
 * Used for click-driven route changes and, via `window.dispatchEvent(new CustomEvent("tb:veil", { detail: { hold } }))`,
 * as a "processing" screen (e.g. while the wizard is being sent).
 */
export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const veil = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLImageElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const mode = useRef<Mode | null>(null);

  const show = useCallback(() => {
    setActive(true);
    requestAnimationFrame(() => {
      const el = veil.current, cam = camera.current, b = burst.current, f = flash.current, lg = logo.current;
      if (!el || !cam || !b || !f || !lg) return;
      tl.current?.kill();
      const t = gsap.timeline();
      t.fromTo(el, { opacity: 0 }, { opacity: 1, duration: FADE_IN, ease: "power2.out" }, 0);
      t.fromTo(cam, { yPercent: -200, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 0.05);
      t.fromTo(b, { scale: 0.2, opacity: 0 }, { scale: 2, opacity: 1, duration: 0.12, ease: "power3.out" }, 0.55);
      t.to(b, { opacity: 0, scale: 2.8, duration: 0.25, ease: "power2.out" }, 0.67);
      t.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, 0.58);
      t.set(cam, { opacity: 0 }, 0.64);
      t.set(lg, { opacity: 1 }, 0.64);
      t.to(f, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0.66);
      tl.current = t;
    });
  }, []);

  const hide = useCallback(() => {
    const el = veil.current;
    const done = () => {
      tl.current?.kill();
      tl.current = null;
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

  // New route rendered: hold until the picture is taken, then fade out.
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={camera} src={asset("/brand/loader-camera.png")} alt="" className="loader-camera" style={{ opacity: 0 }} />
      <div ref={burst} className="loader-burst" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={logo} src={asset("/brand/logo-full-light-1024.png")} alt="" className="loader-logo" style={{ opacity: 0 }} />
      <div ref={flash} className="loader-flash" />
    </div>
  );
}
