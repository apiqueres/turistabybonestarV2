"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Destination, SiteContent } from "@/types/content";
import { KEYS, usePersistedState } from "@/lib/storage";
import { useMotion } from "@/lib/useMotion";
import type { Place } from "@/lib/geo/places";
import { getPlace, rememberPlace } from "@/lib/geo/places";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ZoomMap } from "./ZoomMap";
import { PlaceSearch } from "./PlaceSearch";
import { SelectionBar } from "./SelectionBar";
import { DestinationTabs } from "./DestinationTabs";

interface Props {
  content: SiteContent["map"];
  destinations: Destination[];
}

const NONE: string[] = [];
const fromDestination = (d: Destination): Place => ({ id: d.id, name: d.name, kind: "country", lon: d.lon, lat: d.lat });

/** Search box + zooming map + the list of chosen places, shared with the wizard through localStorage. */
export function MapExperience({ content, destinations }: Props) {
  const params = useSearchParams();
  const initialTab = params.get("pais");
  const recommended = useMemo(() => new Map(destinations.map((d) => [d.id, d.name])), [destinations]);

  const [stored, setStored, hydrated] = usePersistedState<string[]>(KEYS.selection, NONE);
  const selected = useMemo(() => stored.map((id) => getPlace(id)).filter((p): p is Place => !!p), [stored]);
  // `undefined` = nothing chosen on this visit yet: show the ?pais=<id> destination (from the home or the
  // offers) or, failing that, the last place in the stored list.
  const [chosen, setFocus] = useState<Place | null | undefined>(undefined);
  // ?pais= accepts the destination id (home) or its slug (offers).
  const initialDestination = destinations.find((x) => x.id === initialTab || x.slug === initialTab);
  const focus: Place | null =
    chosen !== undefined ? chosen : initialDestination ? fromDestination(initialDestination) : hydrated && selected.length ? selected[selected.length - 1] : null;
  const [tab, setTab] = useState<string>(initialDestination?.id ?? destinations[0].id);

  // One destination only: choosing a new one replaces the previous.
  const add = (p: Place) => {
    rememberPlace(p);
    setStored([p.id]);
    setFocus(p);
  };
  const remove = (id: string) => {
    setStored((s) => s.filter((x) => x !== id));
    if (focus?.id === id) {
      const rest = selected.filter((p) => p.id !== id);
      setFocus(rest.length ? rest[rest.length - 1] : null);
    }
  };
  const toggleDestination = (id: string) => {
    const d = destinations.find((x) => x.id === id);
    if (!d) return;
    if (stored.includes(id)) remove(id);
    else add(fromDestination(d));
  };

  const selectedSet = useMemo(() => new Set(stored), [stored]);
  const selectedItems = selected.map((p) => ({ id: p.id, name: p.kind === "city" && p.country ? `${p.name}, ${p.country}` : p.name }));

  const top = useRef<HTMLElement>(null);
  const bottom = useRef<HTMLElement>(null);
  useMotion(top);
  useMotion(bottom);

  return (
    <>
      <section ref={top} data-section className="section">
        <SectionLabel name="¿Dónde nos vamos?" />
        <div className="section-inner gutter">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-10">
            <div>
              <ScrubHeading as="h1" lines={[content.title]} className="t-h2" />
              <p className="t-body mt-5 max-w-[44ch]" data-reveal>
                {content.text}
              </p>
            </div>
            <div className="md:text-right" data-reveal>
              <div className="kicker" style={{ color: "var(--ink)" }}>
                {content.rule.label}
              </div>
              <div className="kicker mt-2 leading-relaxed">
                {content.rule.hint[0]}
                <br />
                {content.rule.hint[1]}
              </div>
            </div>
          </div>
          <div className="mb-8" data-reveal>
            <PlaceSearch placeholder={content.search.placeholder} hint={content.search.hint} onPick={add} />
          </div>
          <ZoomMap focus={focus} selected={selected} recommended={recommended} legend={content.legend} />
          <SelectionBar list={content.list} selected={selectedItems} onRemove={remove} />
        </div>
      </section>

      <section ref={bottom} data-section className="section section--alt" id="fichas">
        <SectionLabel name={content.recurrent.kicker} />
        <div className="section-inner gutter">
          <div className="cols-2 mb-12">
            <div className="md:pr-16">
              <ScrubHeading lines={content.recurrent.title} className="t-h2" />
            </div>
            <div className="md:pl-16 flex items-end pt-6 md:pt-0">
              <p className="t-body max-w-[44ch]" data-reveal>
                {content.recurrent.text}
              </p>
            </div>
          </div>
          <DestinationTabs content={content} items={destinations} activeId={tab} onSelectTab={setTab} selected={selectedSet} onToggle={toggleDestination} />
        </div>
      </section>
    </>
  );
}
