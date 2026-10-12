"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/config";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markLoaded, prefersReducedMotion } from "@/lib/motion";

/**
 * Intro screen built from the logo layers (see scripts/build-brand.js):
 * the plane flies along its swoosh while the globe spins, then the camera takes the picture.
 * Positions are fractions of the full logo box (1024 × 950).
 */
const BOX = { w: 1024, h: 950 };
const PLANE = { left: 0.79, top: 0.11, width: 0.21 };
const GLOBE = { left: 0.295, top: 0.039, width: 0.41 };
const LENS = { x: 0.355, y: 0.44 };
// Cubic Bézier along the lower arc of the swoosh, ending exactly on the plane's resting spot.
const PATH: [number, number][] = [
  [0.04, 0.38],
  [0.3, 0.56],
  [0.82, 0.5],
  [PLANE.left + PLANE.width / 2, PLANE.top + 0.1],
];
const cubic = (t: number, i: 0 | 1) => {
  const [p0, p1, p2, p3] = PATH.map((p) => p[i]);
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const DURATION = 2.45;

export function Loader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const plane = useRef<HTMLImageElement>(null);
  const globe = useRef<HTMLImageElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    document.documentElement.classList.toggle("reduced-motion", reduced);
    const finish = () => {
      setDone(true);
      document.documentElement.classList.remove("is-loading");
      markLoaded();
      ScrollTrigger.refresh();
    };
    if (reduced) {
      const t = window.setTimeout(finish, 150);
      return () => window.clearTimeout(t);
    }
    const p = plane.current, g = globe.current, f = flash.current, b = burst.current;
    if (!p || !g || !f || !b) return;
    const prog = { t: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(prog, {
      t: 1,
      duration: 1.7,
      ease: "power2.inOut",
      onUpdate: () => {
        const x = cubic(prog.t, 0), y = cubic(prog.t, 1);
        gsap.set(p, { left: `${(x - PLANE.width / 2) * 100}%`, top: `${(y - 0.1) * 100}%` });
      },
    }, 0);
    tl.fromTo(g, { rotate: -40 }, { rotate: 0, duration: 1.9, ease: "power2.inOut" }, 0);
    // the picture: lens burst + a short white flash over the whole screen
    tl.fromTo(b, { scale: 0.2, opacity: 0 }, { scale: 1.6, opacity: 1, duration: 0.18, ease: "power3.out" }, 1.85);
    tl.to(b, { opacity: 0, scale: 2.2, duration: 0.3, ease: "power2.out" }, 2.03);
    tl.fromTo(f, { opacity: 0 }, { opacity: 0.9, duration: 0.08, ease: "none" }, 1.9);
    tl.to(f, { opacity: 0, duration: 0.35, ease: "power2.out" }, 1.98);
    tl.to({}, { duration: DURATION - tl.duration() > 0 ? DURATION - tl.duration() : 0.1 });
    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`loader ${done ? "is-done" : ""}`} aria-hidden onTransitionEnd={() => done && setGone(true)}>
      <div className="loader-inner">
        <div className="loader-logo" style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }} ref={words}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={plane} src={asset("/brand/loader-plane.png")} alt="" className="loader-layer loader-plane" style={{ left: `${PATH[0][0] * 100}%`, top: `${PATH[0][1] * 100}%`, width: `${PLANE.width * 100}%` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/brand/loader-base.png")} alt="" className="loader-layer" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={globe} src={asset("/brand/loader-globe.png")} alt="" className="loader-layer loader-globe" style={{ left: `${GLOBE.left * 100}%`, top: `${GLOBE.top * 100}%`, width: `${GLOBE.width * 100}%` }} />
          <div ref={burst} className="loader-burst" style={{ left: `${LENS.x * 100}%`, top: `${LENS.y * 100}%` }} />
        </div>
      </div>
      <div ref={flash} className="loader-flash" />
    </div>
  );
}
