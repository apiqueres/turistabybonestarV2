"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteContent, TeamMember } from "@/types/content";
import { useMotion } from "@/lib/useMotion";
import { ScrubHeading } from "@/components/motion/ScrubHeading";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { Close } from "@/components/ui/icons";

export function Team({ data }: { data: SiteContent["home"]["team"] }) {
  const ref = useRef<HTMLElement>(null);
  useMotion(ref);

  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [open, setOpen] = useState(false);

  const show = (m: TeamMember) => {
    setSelected(m);
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section id="equipo" ref={ref} data-section className="section section--alt">
      <SectionLabel name="Equipo" />
      <div className="section-inner gutter">
        <ScrubHeading lines={[data.title]} className="t-h2 mb-14" />
        <div className="team-grid" data-cascade>
          {data.members.map((m) => (
            <button
              key={m.id}
              type="button"
              className="card media aspect-square text-left w-full"
              onClick={() => show(m)}
              aria-haspopup="dialog"
              data-cascade-item
            >
              <div className="media-inner">
                <Image src={m.image.src} alt={m.image.alt} fill sizes="(max-width: 900px) 50vw, 25vw" className="object-cover" />
              </div>
              <div
                className="absolute inset-x-0 bottom-0 p-6 pt-28 on-dark"
                style={{ background: "linear-gradient(to top, rgba(11,15,16,0.92) 0%, rgba(11,15,16,0.45) 55%, rgba(11,15,16,0) 100%)" }}
              >
                <div className="t-serif text-[24px] leading-tight">{m.name}</div>
                <div className="t-muted t-small mt-1">{m.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`panel-backdrop ${open ? "is-open" : ""}`} onClick={close} aria-hidden />
      <aside className={`panel ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!open} aria-label={selected?.name}>
        <div className="gutter py-5 flex items-center justify-between rule-b">
          <span className="t-small t-muted">Equipo</span>
          <button type="button" onClick={close} aria-label="Cerrar" className="p-1">
            <Close width={22} height={22} />
          </button>
        </div>
        {selected && (
          <div className="gutter py-8">
            <div className="media" style={{ aspectRatio: "4 / 5" }}>
              <Image src={selected.image.src} alt={selected.image.alt} fill sizes="520px" className="object-cover" />
            </div>
            <h3 className="t-h3 mt-8">{selected.name}</h3>
            <div className="t-muted mt-1">{selected.role}</div>
            <p className="t-body mt-6">{selected.bio}</p>
            <div className="rule mt-8 pt-6 grid grid-cols-2">
              {selected.stats.map((s, i) => (
                <div key={s.label} className={i === 1 ? "v-rule pl-6" : ""}>
                  <div className="t-stat">
                    {s.value.toLocaleString("es-ES")}
                    {s.suffix}
                  </div>
                  <div className="t-muted t-small mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
