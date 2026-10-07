"use client";

import Link from "next/link";
import type { Answers, SetAnswer } from "@/types/form";
import type { Destination } from "@/types/content";
import { placeLabel, rememberPlace, type Place } from "@/lib/geo/places";
import { PlaceSearch } from "@/components/map/PlaceSearch";
import { ArrowRight, Close } from "@/components/ui/icons";

interface Props {
  answers: Answers;
  setAnswer: SetAnswer;
  destinations: Destination[];
}

/** Step 01: the current selection (any country or city) plus the twelve recommended ones. */
export function DestinationsStep({ answers, setAnswer, destinations }: Props) {
  const sel = Array.isArray(answers.destinos) ? (answers.destinos as string[]) : [];
  const toggle = (id: string) =>
    setAnswer("destinos", (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    });
  const addPlace = (p: Place) => {
    rememberPlace(p);
    setAnswer("destinos", (prev) => {
      const cur = Array.isArray(prev) ? (prev as string[]) : [];
      return cur.includes(p.id) ? cur : [...cur, p.id];
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="kicker mb-4">Tu selección · {sel.length}</div>
        {sel.length === 0 ? (
          <div className="t-small t-muted">Todavía no hay ningún destino. Búscalo aquí o elige uno de los recomendados.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sel.map((id) => (
              <button key={id} type="button" className="chip is-on" onClick={() => toggle(id)} aria-label={`Quitar ${placeLabel(id)}`}>
                {placeLabel(id)}
                <Close className="chip-x" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="kicker mb-4">Busca un país o una ciudad</div>
        <PlaceSearch placeholder="¿A dónde? Un país o una ciudad…" onPick={addPlace} size="md" />
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
        <span className="t-muted">¿Quieres verlo en el mapa?</span>
        <Link href="/donde-nos-vamos" className="link-arrow">
          Abrir el mapa
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
