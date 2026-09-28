"use client";

import Link from "next/link";
import type { Answers, SetAnswer } from "@/types/form";
import type { Destination } from "@/types/content";
import map from "@/generated/world-map.json";
import { ArrowRight, Close } from "@/components/ui/icons";

interface Props {
  answers: Answers;
  setAnswer: SetAnswer;
  destinations: Destination[];
}

export const countryName = (id: string) => map.countries.find((c) => c.id === id)?.name ?? id;

/** Step 01: the current selection (any country, from the map) plus the twelve recommended ones. */
export function DestinationsStep({ answers, setAnswer, destinations }: Props) {
  const sel = Array.isArray(answers.destinos) ? (answers.destinos as string[]) : [];
  const toggle = (id: string) =>
    setAnswer("destinos", (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    });
  const recommended = new Set(destinations.map((d) => d.id));
  const others = sel.filter((id) => !recommended.has(id));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="kicker mb-4">Tu selección · {sel.length}</div>
        {sel.length === 0 ? (
          <div className="t-small t-muted">Todavía no hay ningún destino. Elige uno abajo o márcalo en el mapa.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sel.map((id) => (
              <button key={id} type="button" className="chip is-on" onClick={() => toggle(id)} aria-label={`Quitar ${countryName(id)}`}>
                {countryName(id)}
                <Close className="chip-x" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="kicker mb-4">Los que mejor conocemos</div>
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => {
            const on = sel.includes(d.id);
            return (
              <button key={d.id} type="button" className={`chip ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => toggle(d.id)}>
                {d.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="rule pt-6 flex flex-col sm:flex-row sm:items-center gap-4 t-small">
        <span className="t-muted">
          {others.length > 0 ? `Otros países marcados en el mapa: ${others.map(countryName).join(", ")}.` : "¿Otro país? Márcalo en el mapa y vuelve aquí."}
        </span>
        <Link href="/donde-nos-vamos" className="link-arrow">
          Abrir el mapa
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
