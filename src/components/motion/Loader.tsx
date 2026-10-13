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
 * Intro in three beats: the globe spins on its axis in the centre; a big plane crosses the whole screen from the
 * bottom-left corner to the top-right; the camera drops into the centre and its flash reveals the original logo.
 */
const TOTAL = 2.9;
const land = feature(landTopo as unknown as Topology, (landTopo as unknown as Topology).objects.land as GeometryCollection);

export function Loader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plane = useRef<HTMLImageElement>(null);
  const camera = useRef<HTMLImageElement>(null);
  const logo = useRef<HTMLImageElement>(null);
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
    const cv = canvas.current, p = plane.current, cam = camera.current, lg = logo.current, b = burst.current, f = flash.current;
    if (!cv || !p || !cam || !lg || !b || !f) return;

    /* globe: orthographic projection drawn on a square canvas */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = cv.clientWidth || 240;
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
    const spin = { lambda: -220 };
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

    const tl = gsap.timeline({ onComplete: finish });
    if (window.location.search.includes("loader-review")) {
      // review aid: ?loader-review pauses the intro; drive it from the console with window.tbLoader.seek(t, false)
      tl.pause();
      (window as unknown as { tbLoader?: gsap.core.Timeline }).tbLoader = tl;
    }
    // 1. the globe spins
    tl.fromTo(cv, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }, 0);
    tl.to(spin, { lambda: 140, duration: 2.3, ease: "power1.inOut", onUpdate: render }, 0);
    // 2. the plane crosses the screen corner to corner
    // the sprite is centred on (left, top): from -40/140 to 140/-40 the midpoint is the centre of the screen
    tl.fromTo(p, { left: "-40vw", top: "140vh" }, { left: "140vw", top: "-40vh", duration: 1.25, ease: "power1.inOut" }, 0.35);
    // 3. the camera drops into the centre and shoots
    tl.fromTo(cam, { yPercent: -220, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "bounce.out" }, 1.5);
    tl.fromTo(b, { scale: 0.2, opacity: 0 }, { scale: 2, opacity: 1, duration: 0.14, ease: "power3.out" }, 2.12);
    tl.to(b, { opacity: 0, scale: 2.8, duration: 0.25, ease: "power2.out" }, 2.26);
    tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, 2.15);
    // under the flash the scene is swapped for the original logo
    tl.set([cv, cam], { opacity: 0 }, 2.22);
    tl.set(lg, { opacity: 1 }, 2.22);
    tl.to(f, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.24);
    tl.to({}, { duration: Math.max(0.05, TOTAL - tl.duration()) });
    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`loader ${done ? "is-done" : ""}`} aria-hidden onTransitionEnd={() => done && setGone(true)}>
      <canvas ref={canvas} className="loader-globe" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={plane} src={asset("/brand/loader-plane.png")} alt="" className="loader-plane" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={camera} src={asset("/brand/loader-camera.png")} alt="" className="loader-camera" style={{ opacity: 0 }} />
      <div ref={burst} className="loader-burst" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={logo} src={asset("/brand/logo-full-light-1024.png")} alt="" className="loader-logo" style={{ opacity: 0 }} />
      <div ref={flash} className="loader-flash" />
    </div>
  );
}
