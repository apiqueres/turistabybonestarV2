"use client";

import { asset } from "@/lib/config";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { markLoaded, prefersReducedMotion } from "@/lib/motion";

/** Dark intro screen: logo + a thin line drawing left→right for 1 s, then the screen slides away. */
export function Loader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    document.documentElement.classList.toggle("reduced-motion", reduced);
    const t = window.setTimeout(
      () => {
        setDone(true);
        document.documentElement.classList.remove("is-loading");
        markLoaded();
        ScrollTrigger.refresh();
      },
      reduced ? 150 : 1150,
    );
    return () => window.clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className={`loader ${done ? "is-done" : ""}`} aria-hidden onTransitionEnd={() => done && setGone(true)}>
      <div className="loader-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/brand/logo-black-512.png")} alt="" />
        <div className="loader-line" />
      </div>
    </div>
  );
}
