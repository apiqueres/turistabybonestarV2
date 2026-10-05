"use client";

import { useState } from "react";
import type { FormStep, Question } from "@/types/form";
import { useFormSteps } from "@/lib/admin/data";
import { ArrowRight, Close } from "@/components/ui/icons";

const KIND: Record<Question["kind"], string> = { multi: "Selección múltiple", single: "Una respuesta", text: "Texto", date: "Fecha", number: "Número", toggle: "Casilla", destinations: "Destinos (mapa)" };
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `opcion-${Date.now()}`;

export function QuestionsAdmin() {
  const { steps, save, reset, dirty, hydrated } = useFormSteps();
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const step = steps[idx];

  const patchStep = (p: Partial<FormStep>) => save(steps.map((s, i) => (i === idx ? { ...s, ...p } : s)));
  const patchQ = (qi: number, p: Partial<Question>) => patchStep({ questions: step.questions.map((q, i) => (i === qi ? ({ ...q, ...p } as Question) : q)) });

  if (!hydrated || !step) return null;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Preguntas</h1>
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="form-status">{msg}</span>}
          {dirty && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { reset(); setMsg("Restablecidas las preguntas originales."); }}>Restablecer</button>}
        </div>
      </div>
      <div className="admin-list">
        <div className="card">
          {steps.map((s, i) => (
            <button key={s.id} type="button" className={`admin-item ${i === idx ? "is-active" : ""}`} onClick={() => setIdx(i)}>
              <span className="kicker">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1">{s.title.join(" ")}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <div className="card card-pad grid md:grid-cols-2 gap-4">
            <div><label className="lbl" htmlFor="k">Etiqueta</label><input id="k" className="input" value={step.kicker} onChange={(e) => patchStep({ kicker: e.target.value })} /></div>
            <div><label className="lbl" htmlFor="h">Pista</label><input id="h" className="input" value={step.hint ?? ""} onChange={(e) => patchStep({ hint: e.target.value })} /></div>
            <div><label className="lbl" htmlFor="t1">Título, línea 1</label><input id="t1" className="input" value={step.title[0]} onChange={(e) => patchStep({ title: [e.target.value, step.title[1]] })} /></div>
            <div><label className="lbl" htmlFor="t2">Título, línea 2</label><input id="t2" className="input" value={step.title[1]} onChange={(e) => patchStep({ title: [step.title[0], e.target.value] })} /></div>
            <div className="md:col-span-2"><label className="lbl" htmlFor="tx">Texto</label><textarea id="tx" className="textarea" value={step.text} onChange={(e) => patchStep({ text: e.target.value })} /></div>
          </div>

          {step.questions.map((q, qi) => (
            <div key={q.id} className="card card-pad flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <span className="badge">{KIND[q.kind]}</span>
                <span className="t-small t-muted">id: {q.id}</span>
              </div>
              {q.kind !== "destinations" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="lbl" htmlFor={`ql-${q.id}`}>Etiqueta de la pregunta</label><input id={`ql-${q.id}`} className="input" value={q.label ?? ""} onChange={(e) => patchQ(qi, { label: e.target.value } as Partial<Question>)} /></div>
                  {q.kind === "multi" && (
                    <div><label className="lbl" htmlFor={`qm-${q.id}`}>Máximo de opciones (vacío = sin límite)</label><input id={`qm-${q.id}`} className="input" type="number" min={1} value={q.max ?? ""} onChange={(e) => patchQ(qi, { max: e.target.value ? Number(e.target.value) : undefined } as Partial<Question>)} /></div>
                  )}
                  {(q.kind === "multi" || q.kind === "single") && (
                    <div><label className="lbl" htmlFor={`qy-${q.id}`}>Presentación</label>
                      <select id={`qy-${q.id}`} className="select" value={q.layout} onChange={(e) => patchQ(qi, { layout: e.target.value as "cards" | "chips" } as Partial<Question>)}><option value="chips">Chips</option><option value="cards">Tarjetas con descripción</option></select></div>
                  )}
                  {q.kind === "text" && (
                    <div><label className="lbl" htmlFor={`qp-${q.id}`}>Placeholder</label><input id={`qp-${q.id}`} className="input" value={q.placeholder ?? ""} onChange={(e) => patchQ(qi, { placeholder: e.target.value } as Partial<Question>)} /></div>
                  )}
                </div>
              )}
              {(q.kind === "multi" || q.kind === "single") && (
                <div className="flex flex-col gap-2">
                  <span className="lbl">Opciones</span>
                  {q.options.map((o, oi) => (
                    <div key={o.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[220px_1fr_auto] gap-2 items-center">
                      <input className="input" value={o.label} aria-label="Opción" onChange={(e) => patchQ(qi, { options: q.options.map((x, i) => (i === oi ? { ...x, label: e.target.value } : x)) } as Partial<Question>)} />
                      {q.layout === "cards" ? (
                        <input className="input" value={o.text ?? ""} placeholder="Descripción corta" aria-label="Descripción" onChange={(e) => patchQ(qi, { options: q.options.map((x, i) => (i === oi ? { ...x, text: e.target.value } : x)) } as Partial<Question>)} />
                      ) : <span className="hidden md:block" />}
                      <button type="button" aria-label="Quitar opción" onClick={() => patchQ(qi, { options: q.options.filter((_, i) => i !== oi) } as Partial<Question>)}><Close width={18} height={18} /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => { const label = `Nueva opción ${q.options.length + 1}`; patchQ(qi, { options: [...q.options, { id: slug(label), label }] } as Partial<Question>); }}>
                    Añadir opción<ArrowRight className="btn-icon" />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="t-small t-muted">Los cambios se guardan automáticamente en este navegador. Cuando exista la base de datos, este editor escribirá en la API.</div>
        </div>
      </div>
    </>
  );
}
