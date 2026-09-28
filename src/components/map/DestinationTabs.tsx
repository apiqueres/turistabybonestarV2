"use client";

import Image from "next/image";
import Link from "next/link";
import type { Destination, SiteContent } from "@/types/content";
import { ArrowRight } from "@/components/ui/icons";

interface Props {
  content: SiteContent["map"];
  items: Destination[];
  activeId: string;
  onSelectTab: (id: string) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function DestinationTabs({ content, items, activeId, onSelectTab, selected, onToggle }: Props) {
  const active = items.find((d) => d.id === activeId) ?? items[0];
  const isSel = selected.has(active.id);
  const rows: [string, string][] = [
    ["Mejor época", active.bestSeason],
    ["Vuelo desde Valencia", active.flight],
    ["Duración sugerida", active.duration],
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Destinos">
        {items.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={d.id === active.id}
            className={`tab ${d.id === active.id ? "is-on" : ""}`}
            onClick={() => onSelectTab(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div key={active.id} className="ficha cols-2 rule mt-10 pt-10">
        <div className="md:pr-16">
          <div className="media" style={{ aspectRatio: "4 / 5" }}>
            <Image src={active.image.src} alt={active.image.alt} fill sizes="(max-width: 900px) 100vw, 50vw" className="object-cover" priority={false} />
          </div>
          <div className="kicker mt-4">
            {active.region} · {active.code}
          </div>
        </div>
        <div className="md:pl-16 pt-10 md:pt-0">
          <h3 className="t-h2">{active.name}</h3>
          <p className="t-body text-[18px] mt-3 max-w-[40ch]">{active.tagline}</p>
          <dl className="rule mt-8">
            {rows.map(([k, v]) => (
              <div key={k} className="rule-b py-4 flex justify-between gap-6 t-small">
                <dt className="kicker">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-body mt-8 max-w-[52ch]">
            Nos encargamos de la ruta completa: vuelos, trenes, alojamientos, traslados y las reservas que hay que pelear con
            meses de antelación.
          </p>
          <ul className="mt-6 flex flex-col gap-2 t-body t-small">
            {active.includes.map((i) => (
              <li key={i} className="flex gap-3">
                <span className="t-muted">—</span>
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <button type="button" className={`btn btn-sm ${isSel ? "btn-primary" : "btn-secondary"}`} onClick={() => onToggle(active.id)} aria-pressed={isSel}>
              {isSel ? content.remove : content.add}
            </button>
            <Link href={content.list.ctaHref} className="btn btn-secondary btn-sm">
              {content.list.cta}
              <ArrowRight className="btn-icon" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
