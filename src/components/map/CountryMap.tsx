"use client";

import { useEffect, useRef, useState } from "react";
import map from "@/generated/world-map.json";

interface Props {
  /** Recommended destinations by id, with their names (some have no polygon, e.g. islands). */
  recommended: Map<string, string>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  legend: [string, string];
}

/**
 * World map with one path per country (pre-projected by scripts/build-map.mjs).
 * Every country can be toggled; the recommended ones are tinted and carry a pulsing marker.
 */
export function CountryMap({ recommended, selected, onToggle, legend }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const hoverCountry = hover
    ? (map.countries.find((c) => c.id === hover) ??
      (() => {
        const p = map.points.find((pt) => pt.id === hover);
        return p ? { id: p.id, name: recommended.get(p.id) ?? p.id, cx: p.x, cy: p.y } : undefined;
      })())
    : undefined;
  const polygons = new Set(map.countries.map((c) => c.id));
  const scroll = useRef<HTMLDivElement>(null);

  // On narrow screens the map is wider than the viewport: start centred on Europe/Africa.
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.55;
  }, []);

  return (
    <div>
      <div ref={scroll} className="map-scroll">
      <div className="map-canvas" style={{ aspectRatio: `${map.width} / ${map.height}` }}>
        <svg viewBox={`0 0 ${map.width} ${map.height}`} className="w-full h-full" role="group" aria-label="Mapa de países">
          {map.countries.map((c) => {
            const isRec = recommended.has(c.id);
            const isSel = selected.has(c.id);
            return (
              <path
                key={c.id}
                d={c.d}
                className={`country is-selectable ${isRec ? "is-available" : ""} ${isSel ? "is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={c.name}
                onClick={() => onToggle(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(c.id);
                  }
                }}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.id)}
                onBlur={() => setHover(null)}
              />
            );
          })}
          {map.points.map((p) => {
            const island = !polygons.has(p.id);
            return (
              <g
                key={p.id}
                className={`map-dot is-lit ${selected.has(p.id) ? "is-selected" : ""} ${island ? "is-island" : ""}`}
                transform={`translate(${p.x} ${p.y})`}
                pointerEvents={island ? "auto" : "none"}
                role={island ? "button" : undefined}
                tabIndex={island ? 0 : undefined}
                aria-pressed={island ? selected.has(p.id) : undefined}
                aria-label={island ? recommended.get(p.id) : undefined}
                onClick={island ? () => onToggle(p.id) : undefined}
                onKeyDown={island ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(p.id); } } : undefined}
                onMouseEnter={island ? () => setHover(p.id) : undefined}
                onMouseLeave={island ? () => setHover(null) : undefined}
              >
                <circle className="halo" r="14" />
                {island && <circle r="12" fill="transparent" />}
                <circle className="dot-core" r={island ? 5 : 3.5} fill="var(--accent)" />
              </g>
            );
          })}
        </svg>
        {hoverCountry && (
          <div className="map-tooltip" style={{ left: `${(hoverCountry.cx / map.width) * 100}%`, top: `${(hoverCountry.cy / map.height) * 100}%` }}>
            <div>{hoverCountry.name}</div>
            <div className="t-muted">
              {recommended.has(hoverCountry.id) ? "Recomendado · " : ""}
              {selected.has(hoverCountry.id) ? "Pulsa para quitarlo" : "Pulsa para marcarlo"}
            </div>
          </div>
        )}
      </div>
      </div>
      <div className="kicker mt-3 md:hidden">Desliza el mapa hacia los lados para recorrerlo</div>
      <div className="rule mt-4 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 kicker">
        <span>{legend[0]}</span>
        <span>{legend[1]}</span>
      </div>
    </div>
  );
}
