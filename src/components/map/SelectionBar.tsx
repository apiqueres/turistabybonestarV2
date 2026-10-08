"use client";

import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { ArrowRight, Close } from "@/components/ui/icons";

interface Props {
  list: SiteContent["map"]["list"];
  selected: { id: string; name: string }[];
  onRemove: (id: string) => void;
}

/** Botón "Te lo organizamos": desactivado hasta que haya un destino elegido. */
export function SelectionCta({ list, count, className = "" }: { list: SiteContent["map"]["list"]; count: number; className?: string }) {
  if (count === 0) {
    return (
      <span className={`btn btn-primary btn-sm ${className}`} aria-disabled="true" title={list.needOne} style={{ opacity: 0.45, cursor: "not-allowed" }}>
        {list.cta}
        <ArrowRight className="btn-icon" />
      </span>
    );
  }
  return (
    <Link href={list.ctaHref} className={`btn btn-primary btn-sm ${className}`}>
      {list.cta}
      <ArrowRight className="btn-icon" />
    </Link>
  );
}

export function SelectionBar({ list, selected, onRemove }: Props) {
  const n = selected.length;
  return (
    <div className="rule mt-8 pt-6 flex flex-col md:flex-row md:items-center gap-6">
      <div className="kicker text-ink whitespace-nowrap" style={{ color: "var(--ink)" }}>
        {list.label}
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        {n === 0 ? (
          <span className="kicker">{list.empty}</span>
        ) : (
          selected.map((d) => (
            <button key={d.id} type="button" className="chip is-on" onClick={() => onRemove(d.id)} aria-label={`Quitar ${d.name}`}>
              {d.name}
              <Close className="chip-x" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
