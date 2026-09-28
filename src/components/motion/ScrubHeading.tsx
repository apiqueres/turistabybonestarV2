"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

interface Props {
  lines: string[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
}

/** Heading revealed word by word, tied to scroll: each word goes from 20 % white to white. */
export function ScrubHeading({ lines, as = "h2", className = "", id }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add("is-static");
      return;
    }
    const words = el.querySelectorAll(".word");
    const onDark = Boolean(el.closest(".on-dark"));
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { color: onDark ? "rgba(255,255,255,0.25)" : "rgba(11,15,16,0.18)" },
        {
          color: onDark ? "#ffffff" : "#0b0f10",
          ease: "none",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 85%", end: "top 35%", scrub: 0.6 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const children = lines.map((line, li) => {
    const words = line.split(" ");
    return (
      <span key={li} className="block">
        {words.map((w, wi) => (
          <span key={wi} className="word">
            {w}
            {wi < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  });

  const cls = `scrub ${className}`;
  if (as === "h1") {
    return (
      <h1 ref={ref} id={id} className={cls}>
        {children}
      </h1>
    );
  }
  if (as === "h3") {
    return (
      <h3 ref={ref} id={id} className={cls}>
        {children}
      </h3>
    );
  }
  return (
    <h2 ref={ref} id={id} className={cls}>
      {children}
    </h2>
  );
}
