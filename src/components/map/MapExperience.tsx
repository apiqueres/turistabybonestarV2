"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Destination, SiteContent } from "@/types/content";
import { KEYS, usePersistedState } from "@/lib/storage";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import map from "@/generated/world-map.json";
import { CountryMap } from "./CountryMap";
import { SelectionBar } from "./SelectionBar";
import { DestinationTabs } from "./DestinationTabs";

interface Props {
  content: SiteContent["map"];
  destinations: Destination[];
}

const NONE: string[] = [];
const baseNames = new Map(map.countries.map((c) => [c.id, c.name]));

/** Holds the selection state shared by the map, the list bar and the destination cards. */
export function MapExperience({ content, destinations }: Props) {
  const params = useSearchParams();
  const initialTab = params.get("pais");
  const recommended = useMemo(() => new Map(destinations.map((d) => [d.id, d.name])), [destinations]);
  const countryNames = useMemo(() => new Map([...baseNames, ...recommended]), [recommended]);

  const [stored, setSelected] = usePersistedState<string[]>(KEYS.selection, NONE);
  const selected = useMemo(() => stored.filter((id) => countryNames.has(id)), [stored, countryNames]);
  const [tab, setTab] = useState<string>(initialTab && recommended.has(initialTab) ? initialTab : destinations[0].id);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedItems = selected.map((id) => ({ id, name: countryNames.get(id) ?? id }));

  const top = useRef<HTMLElement>(null);
  const bottom = useRef<HTMLElement>(null);
  useMotion(top);
  useMotion(bottom);

  return (
    <>
      <section ref={top} data-section className="section">
        <SectionLabel name="¿Dónde nos vamos?" />
        <div className="section-inner gutter">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-12">
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
          <CountryMap recommended={recommended} selected={selectedSet} onToggle={toggle} legend={content.legend} />
          <SelectionBar list={content.list} selected={selectedItems} onRemove={toggle} />
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
          <DestinationTabs content={content} items={destinations} activeId={tab} onSelectTab={setTab} selected={selectedSet} onToggle={toggle} />
        </div>
      </section>
    </>
  );
}
