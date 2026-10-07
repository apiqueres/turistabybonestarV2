"use client";

import { useEffect, useRef } from "react";
import map from "@/generated/world-map.json";
import type { Place } from "@/lib/geo/places";
import { project } from "@/lib/geo/equal-earth";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

interface Props {
  /** The place the map flies to (the last one chosen). */
  focus: Place | null;
  selected: Place[];
  recommended: Map<string, string>;
  legend: [string, string];
}

type View = { s: number; cx: number; cy: number };
const WORLD: View = { s: 1, cx: map.width / 2, cy: map.height / 2 };
const polygons = new Set(map.countries.map((c) => c.id));

/** Where the map should look for a place: the country's bounding box, or a close-up on the city. */
function viewFor(p: Place): View {
  if (p.kind === "country") {
    const c = map.countries.find((x) => x.id === p.id);
    if (c) {
      const [x0, y0, x1, y1] = c.bbox;
      const w = Math.max(x1 - x0, 40), h = Math.max(y1 - y0, 30);
      const s = Math.min(map.width / w, map.height / h) * 0.55;
      return { s: Math.min(Math.max(s, 1.4), 9), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    }
    const pt = map.points.find((x) => x.id === p.id);
    if (pt) return { s: 7, cx: pt.x, cy: pt.y };
    return WORLD;
  }
  const [x, y] = project(p.lon, p.lat);
  return { s: 7, cx: x, cy: y };
}

const transformOf = (v: View) => `translate(${map.width / 2} ${map.height / 2}) scale(${v.s}) translate(${-v.cx} ${-v.cy})`;

/**
 * Non-interactive world map that zooms towards the chosen place. Markers live inside the zoomed group and
 * are counter-scaled on every frame so they keep their size.
 */
export function ZoomMap({ focus, selected, recommended, legend }: Props) {
  const group = useRef<SVGGElement>(null);
  const view = useRef<View>({ ...WORLD });
  const scroll = useRef<HTMLDivElement>(null);

  const apply = () => {
    const g = group.current;
    if (!g) return;
    const v = view.current;
    g.setAttribute("transform", transformOf(v));
    const k = 1 / v.s;
    g.querySelectorAll<SVGGElement>("[data-marker]").forEach((m) => {
      m.setAttribute("transform", `translate(${m.dataset.x} ${m.dataset.y}) scale(${k})`);
    });
    // Narrow screens scroll the canvas sideways: keep the focus in the middle.
    const el = scroll.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  };

  useEffect(() => {
    const target = focus ? viewFor(focus) : WORLD;
    if (prefersReducedMotion()) {
      view.current = { ...target };
      apply();
      return;
    }
    const tween = gsap.to(view.current, { ...target, duration: 1.6, ease: "power3.inOut", onUpdate: apply });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.id]);

  // Markers added or removed: re-apply the counter-scale immediately.
  useEffect(() => {
    apply();
  });

  const selectedCountries = new Set(selected.filter((p) => p.kind === "country").map((p) => p.id));
  const hostCountries = new Set(selected.map((p) => p.countryId).filter((x): x is string => !!x));
  const cities = selected.filter((p) => p.kind === "city");
  const focusCountry = focus?.kind === "country" ? focus.id : focus?.countryId;

  return (
    <div>
      <div ref={scroll} className="map-scroll">
        <div className="map-canvas">
          {/* Full width, cropped top and bottom (polar edges) so the map stays low: see .map-canvas */}
          <svg viewBox={`0 0 ${map.width} ${map.height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full zoom-map" role="img" aria-label={focus ? `Mapa centrado en ${focus.name}` : "Mapa del mundo"}>
            <g ref={group} transform={transformOf(WORLD)}>
              {map.countries.map((c) => (
                <path
                  key={c.id}
                  d={c.d}
                  className={`country ${recommended.has(c.id) ? "is-available" : ""} ${selectedCountries.has(c.id) || hostCountries.has(c.id) ? "is-selected" : ""} ${focusCountry === c.id ? "is-focus" : ""}`}
                />
              ))}
              {map.points.map((p) => {
                const island = !polygons.has(p.id);
                const on = selectedCountries.has(p.id);
                return (
                  <g key={p.id} data-marker data-x={p.x} data-y={p.y} className={`map-dot is-lit ${on ? "is-selected" : ""} ${island ? "is-island" : ""}`}>
                    <circle className="halo" r="14" />
                    <circle className="dot-core" r={island ? 5 : 3.5} fill="var(--accent)" />
                  </g>
                );
              })}
              {cities.map((p) => {
                const [x, y] = project(p.lon, p.lat);
                const isFocus = focus?.id === p.id;
                return (
                  <g key={p.id} data-marker data-x={x} data-y={y} className={`city-pin ${isFocus ? "is-focus" : ""}`}>
                    <circle className="city-ring" r="13" />
                    <circle r="6" />
                    <text x="20" y="6">{p.name}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
      <div className="rule mt-4 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 kicker">
        <span>{legend[0]}</span>
        <span>{focus ? `Mostrando ${focus.kind === "city" && focus.country ? `${focus.name}, ${focus.country}` : focus.name}` : legend[1]}</span>
      </div>
    </div>
  );
}
