"use client";

import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { ArrowRight, Close } from "@/components/ui/icons";

interface Props {
  list: SiteContent["map"]["list"];
  selected: { id: string; name: string }[];
  onRemove: (id: string) => void;
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
      {n === 0 ? (
        <span className="btn btn-primary btn-sm self-start md:self-auto" aria-disabled="true" title={list.needOne} style={{ opacity: 0.45, cursor: "not-allowed" }}>
          {list.cta}
          <ArrowRight className="btn-icon" />
        </span>
      ) : (
        <Link href={list.ctaHref} className="btn btn-primary btn-sm self-start md:self-auto">
          {list.cta}
          <ArrowRight className="btn-icon" />
        </Link>
      )}
    </div>
  );
}
