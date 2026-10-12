"use client";

import { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";
import { asset } from "@/lib/config";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { markLoaded, prefersReducedMotion } from "@/lib/motion";

/**
 * Intro built from the logo layers (scripts/build-brand.mjs), in three beats:
 *  1. the globe appears spinning on its axis (drawn live with d3-geo over the land geometry);
 *  2. the plane comes out from behind it and draws its swoosh as it flies to its spot;
 *  3. the camera drops from above and takes the picture: lens burst and a white flash over the whole screen.
 * Then the wordmark settles in and the screen slides away. Fractions refer to the 1024 × 950 logo box.
 */
const BOX = { w: 1024, h: 950 };
const GLOBE = { cx: 0.5, cy: 0.26, r: 0.205 }; // r as a fraction of the width
const PLANE = { width: 0.21, height: 0.2, heading: -41 }; // sprite points up-right
const LENS = { x: 0.355, y: 0.44 };
/** Swoosh centre line in logo pixels: starts behind the globe, swings round the left tip, runs under the camera and climbs to the plane. */
const TRAIL = "M 358 285 C 230 330 70 400 82 455 C 95 520 260 515 430 500 C 600 485 740 460 800 410 C 850 365 875 245 916 200";
const TOTAL = 3.7;

const land = feature(landTopo as unknown as Topology, (landTopo as unknown as Topology).objects.land as GeometryCollection);

export function Loader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const globeRaster = useRef<HTMLImageElement>(null);
  const maskPath = useRef<SVGPathElement>(null);
  const plane = useRef<HTMLImageElement>(null);
  const camera = useRef<HTMLImageElement>(null);
  const words = useRef<HTMLImageElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

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
    const cv = canvas.current, mp = maskPath.current, p = plane.current, cam = camera.current, w = words.current, b = burst.current, f = flash.current, gr = globeRaster.current;
    if (!cv || !mp || !p || !cam || !w || !b || !f || !gr) return;

    /* --- globe: orthographic projection on a square canvas --- */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = cv.clientWidth || 160;
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const projection = geoOrthographic().translate([size / 2, size / 2]).scale(size / 2 - 1).clipAngle(90);
    const draw = geoPath(projection, ctx);
    const sea = ctx.createRadialGradient(size * 0.38, size * 0.34, size * 0.05, size / 2, size / 2, size / 2);
    sea.addColorStop(0, "#7fdcf3");
    sea.addColorStop(0.55, "#1fb9df");
    sea.addColorStop(1, "#0597bb");
    const spin = { lambda: -200 };
    const render = () => {
      projection.rotate([spin.lambda, -14]);
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      draw({ type: "Sphere" });
      ctx.fillStyle = sea;
      ctx.fill();
      ctx.beginPath();
      draw(land);
      ctx.fillStyle = "#0b2730";
      ctx.fill();
      ctx.beginPath();
      draw({ type: "Sphere" });
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.stroke();
    };
    render();

    /* --- plane + trail along the swoosh --- */
    const len = mp.getTotalLength();
    mp.style.strokeDasharray = `${len}`;
    mp.style.strokeDashoffset = `${len}`;
    const flight = { t: 0 };
    const placePlane = () => {
      const s = flight.t * len;
      const pt = mp.getPointAtLength(s);
      const ahead = mp.getPointAtLength(Math.min(len, s + 3));
      const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
      gsap.set(p, { left: `${(pt.x / BOX.w - PLANE.width / 2) * 100}%`, top: `${(pt.y / BOX.h - PLANE.height / 2) * 100}%`, rotate: angle - PLANE.heading });
      mp.style.strokeDashoffset = `${len * (1 - flight.t)}`;
    };
    placePlane();

    const tl = gsap.timeline({ onComplete: finish });
    if (window.location.search.includes("loader-review")) {
      // review aid: ?loader-review pauses the intro; drive it from the console with window.tbLoader.seek(t)
      tl.pause();
      (window as unknown as { tbLoader?: gsap.core.Timeline }).tbLoader = tl;
    }
    // 1. globe
    tl.fromTo(cv, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0);
    tl.to(spin, { lambda: 120, duration: 3.1, ease: "power1.inOut", onUpdate: render }, 0);
    // 2. plane draws the swoosh
    tl.to(flight, { t: 1, duration: 1.5, ease: "power2.inOut", onUpdate: placePlane }, 0.55);
    tl.to(p, { rotate: 0, duration: 0.25, ease: "power2.out" }, 2.05);
    // 3. camera drops and shoots
    tl.fromTo(cam, { yPercent: -55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.75, ease: "bounce.out" }, 2.15);
    tl.fromTo(b, { scale: 0.2, opacity: 0 }, { scale: 1.8, opacity: 1, duration: 0.16, ease: "power3.out" }, 2.92);
    tl.to(b, { opacity: 0, scale: 2.6, duration: 0.35, ease: "power2.out" }, 3.08);
    tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.07, ease: "none" }, 2.96);
    tl.to(f, { opacity: 0, duration: 0.55, ease: "power2.out" }, 3.03);
    // wordmark and the still globe of the logo settle in under the flash
    tl.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 3.0);
    tl.to(cv, { opacity: 0, duration: 0.35 }, 3.05);
    tl.to(gr, { opacity: 1, duration: 0.35 }, 3.05);
    tl.to({}, { duration: Math.max(0.05, TOTAL - tl.duration()) });
    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;

  const globeStyle = { left: `${(GLOBE.cx - GLOBE.r) * 100}%`, top: `${((GLOBE.cy * BOX.h - GLOBE.r * BOX.w) / BOX.h) * 100}%`, width: `${GLOBE.r * 2 * 100}%` };
  return (
    <div className={`loader ${done ? "is-done" : ""}`} aria-hidden onTransitionEnd={() => done && setGone(true)}>
      <div className="loader-inner">
        <div className="loader-logo" style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }}>
          <svg className="loader-layer loader-trail" viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
            <defs>
              <mask id="tb-trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={BOX.w} height={BOX.h}>
                <path ref={maskPath} d={TRAIL} fill="none" stroke="#fff" strokeWidth="130" strokeLinecap="round" strokeLinejoin="round" />
              </mask>
            </defs>
            <image href={asset("/brand/loader-ring.png")} width={BOX.w} height={BOX.h} mask="url(#tb-trail-mask)" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={plane} src={asset("/brand/loader-plane.png")} alt="" className="loader-layer loader-plane" style={{ width: `${PLANE.width * 100}%` }} />
          <canvas ref={canvas} className="loader-layer loader-globe" style={globeStyle} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={globeRaster} src={asset("/brand/loader-globe.png")} alt="" className="loader-layer" style={{ opacity: 0 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={camera} src={asset("/brand/loader-camera.png")} alt="" className="loader-layer" style={{ opacity: 0 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={words} src={asset("/brand/loader-words.png")} alt="" className="loader-layer" style={{ opacity: 0 }} />
          <div ref={burst} className="loader-burst" style={{ left: `${LENS.x * 100}%`, top: `${LENS.y * 100}%` }} />
        </div>
      </div>
      <div ref={flash} className="loader-flash" />
    </div>
  );
}
