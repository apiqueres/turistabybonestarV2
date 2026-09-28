"use client";

import type { Answers, Question, SetAnswer } from "@/types/form";
import type { Destination } from "@/types/content";
import { DestinationsStep } from "./DestinationsStep";

interface Props {
  question: Question;
  answers: Answers;
  setAnswer: SetAnswer;
  destinations: Destination[];
}

/** Renders one question of the wizard according to its `kind`. */
export function QuestionField({ question: q, answers, setAnswer, destinations }: Props) {
  const value = answers[q.id];

  if (q.kind === "destinations") {
    return <DestinationsStep answers={answers} setAnswer={setAnswer} destinations={destinations} />;
  }

  if (q.kind === "multi") {
    const arr = Array.isArray(value) ? value : [];
    const full = q.max !== undefined && arr.length >= q.max;
    const toggle = (id: string) =>
      setAnswer(q.id, (prev) => {
        const cur = Array.isArray(prev) ? prev : [];
        if (cur.includes(id)) return cur.filter((x) => x !== id);
        if (q.max !== undefined && cur.length >= q.max) return cur;
        return [...cur, id];
      });
    return (
      <div>
        {q.label && <div className="kicker mb-4">{q.label}</div>}
        <div className={q.layout === "cards" ? "opt-grid" : "flex flex-wrap gap-2"}>
          {q.options.map((o) => {
            const on = arr.includes(o.id);
            const cls = q.layout === "cards" ? "opt-card" : "chip";
            return (
              <button key={o.id} type="button" className={`${cls} ${on ? "is-on" : ""} ${!on && full ? "is-off" : ""}`} aria-pressed={on} onClick={() => toggle(o.id)}>
                {q.layout === "cards" ? (
                  <>
                    <div className="opt-title">{o.label}</div>
                    {o.text && <p className="t-body t-small mt-3">{o.text}</p>}
                  </>
                ) : (
                  o.label
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.kind === "single") {
    const cur = typeof value === "string" ? value : "";
    return (
      <div>
        {q.label && <div className="kicker mb-4">{q.label}</div>}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.label}>
          {q.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={cur === o.id} className={`chip ${cur === o.id ? "is-on" : ""}`} onClick={() => setAnswer(q.id, (prev) => (prev === o.id ? undefined : o.id))}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.kind === "text") {
    const cur = typeof value === "string" ? value : "";
    const label = q.required ? `${q.label} *` : q.label;
    return (
      <div className="field">
        <label htmlFor={q.id}>{label}</label>
        {q.multiline ? (
          <textarea id={q.id} value={cur} placeholder={q.placeholder} onChange={(e) => setAnswer(q.id, e.target.value)} />
        ) : (
          <input id={q.id} type={q.inputType ?? "text"} value={cur} placeholder={q.placeholder ?? "Escribe aquí"} autoComplete={q.inputType === "email" ? "email" : q.inputType === "tel" ? "tel" : "name"} onChange={(e) => setAnswer(q.id, e.target.value)} />
        )}
      </div>
    );
  }

  if (q.kind === "date") {
    const cur = typeof value === "string" ? value : "";
    return (
      <div className="field">
        <label htmlFor={q.id}>{q.label}</label>
        <input id={q.id} type="date" value={cur} onChange={(e) => setAnswer(q.id, e.target.value)} />
      </div>
    );
  }

  if (q.kind === "number") {
    const cur = typeof value === "number" ? value : "";
    return (
      <div className="field">
        <label htmlFor={q.id}>{q.label}</label>
        <input id={q.id} type="number" min={q.min} max={q.max} value={cur} placeholder="2" onChange={(e) => setAnswer(q.id, e.target.value === "" ? undefined : Number(e.target.value))} />
      </div>
    );
  }

  // toggle
  const on = value === true;
  return (
    <label className="check">
      <input type="checkbox" checked={on} onChange={(e) => setAnswer(q.id, e.target.checked ? true : undefined)} />
      <span>{q.required ? `${q.label} *` : q.label}</span>
    </label>
  );
}
