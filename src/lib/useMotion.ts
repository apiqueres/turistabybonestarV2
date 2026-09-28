"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";

/**
 * Declarative scroll motion for a section root. Looks for:
 *  - [data-reveal]         blur(8px)→0 + opacity 0→1, staggered 80 ms inside [data-reveal-group]
 *  - [data-parallax]       vertical parallax (±40px) on the inner <img>, blur up to 10px on exit
 *  - [data-counter="N"]    counts from 0 to N when entering the viewport
 *  - [data-cascade]        children [data-cascade-item] rise 40px→0, 120 ms apart
 */
export function useMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      /* Reveals */
      const handled = new Set<Element>();
      const reveal = (items: Element[], trigger: Element) => {
        if (!items.length) return;
        if (reduced) {
          gsap.set(items, { opacity: 1 });
          return;
        }
        gsap.fromTo(
          items,
          { opacity: 0, filter: "blur(8px)", y: 14 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 1,
            ease: "power2.out",
            stagger: 0.08,
            scrollTrigger: { trigger, start: "top 85%", once: true },
          },
        );
      };
      root.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = Array.from(group.querySelectorAll("[data-reveal]"));
        items.forEach((i) => handled.add(i));
        reveal(items, group);
      });
      Array.from(root.querySelectorAll("[data-reveal]"))
        .filter((i) => !handled.has(i))
        .forEach((i) => reveal([i], i));

      /* Parallax + blur on exit */
      if (!reduced) {
        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((wrap) => {
          const media = wrap.querySelector<HTMLElement>("img");
          if (!media) return;
          gsap.set(media, { scale: 1.12 });
          gsap.fromTo(
            media,
            { y: -40 },
            {
              y: 40,
              ease: "none",
              scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          gsap.fromTo(
            media,
            { "--blur": "0px" },
            {
              "--blur": "10px",
              ease: "none",
              scrollTrigger: { trigger: wrap, start: "bottom 45%", end: "bottom top", scrub: true },
            },
          );
        });
      }

      /* Counters */
      root.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
        const target = Number(el.dataset.counter ?? 0);
        const format = (n: number) => Math.round(n).toLocaleString("es-ES");
        if (reduced) {
          el.textContent = format(target);
          return;
        }
        el.textContent = "0";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = format(obj.v);
          },
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* Cascades */
      if (!reduced) {
        root.querySelectorAll<HTMLElement>("[data-cascade]").forEach((grid) => {
          const items = grid.querySelectorAll("[data-cascade-item]");
          if (!items.length) return;
          gsap.from(items, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.12,
            scrollTrigger: { trigger: grid, start: "top 80%", once: true },
          });
        });
      }
    }, root);

    return () => ctx.revert();
  }, [ref]);
}
