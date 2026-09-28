"use client";

import { useState } from "react";
import map from "@/generated/world-map.json";

interface Props {
  recommended: Set<string>;
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
  const hoverCountry = hover ? map.countries.find((c) => c.id === hover) : undefined;

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: `${map.width} / ${map.height}` }}>
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
          {map.points.map((p) => (
            <g key={p.id} className={`map-dot is-lit ${selected.has(p.id) ? "is-selected" : ""}`} transform={`translate(${p.x} ${p.y})`} pointerEvents="none">
              <circle className="halo" r="14" />
              <circle className="dot-core" r="3.5" fill="var(--accent)" />
            </g>
          ))}
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
      <div className="rule mt-4 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 kicker">
        <span>{legend[0]}</span>
        <span>{legend[1]}</span>
      </div>
    </div>
  );
}
