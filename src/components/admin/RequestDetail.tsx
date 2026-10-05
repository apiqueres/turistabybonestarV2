"use client";

import { useState } from "react";
import type { StoredRequest, RequestStatus } from "@/data/mock-solicitudes";
import type { FormStep } from "@/types/form";
import type { EmailBrand } from "@/lib/email-shell";
import { buildPrompt } from "@/lib/prompt";
import { clientConfirmationEmail, openPreview } from "@/lib/email-templates";
import { ArrowRight } from "@/components/ui/icons";
import { MessageComposer } from "./MessageComposer";

export const STATUS: Record<RequestStatus, string> = { nueva: "Nueva", "en-curso": "En curso", cerrada: "Cerrada" };

interface Props {
  request: StoredRequest;
  steps: FormStep[];
  brand: EmailBrand;
  update: (id: string, patch: Partial<StoredRequest>) => void;
}

function labelFor(steps: FormStep[], qid: string, value: unknown): [string, string] {
  for (const s of steps) {
    for (const q of s.questions) {
      if (q.id !== qid) continue;
      const label = ("label" in q && q.label) || s.kicker.replace(/^\d+\s—\s/, "");
      const opt = (id: string) => (q.kind === "multi" || q.kind === "single" ? (q.options.find((o) => o.id === id)?.label ?? id) : id);
      const text = Array.isArray(value) ? value.map((v) => opt(String(v))).join(", ") : typeof value === "boolean" ? (value ? "Sí" : "No") : opt(String(value));
      return [label, text];
    }
  }
  return [qid, String(value)];
}

/** Everything about one request, rendered inline under its row: status, notes, answers, brief and the composer. */
export function RequestDetail({ request: r, steps, brand, update }: Props) {
  const [composing, setComposing] = useState(false);
  const brief = buildPrompt(r.id, r.createdAt, r.data);
  const download = () => {
    const url = URL.createObjectURL(new Blob([brief], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lbl" htmlFor={`st-${r.id}`}>Estado</label>
            <select id={`st-${r.id}`} className="select" value={r.status} onChange={(e) => update(r.id, { status: e.target.value as RequestStatus })}>
              {(Object.keys(STATUS) as RequestStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="lbl">Contacto</span>
            <div className="t-small break-all">{r.data.contacto.email}</div>
            <div className="t-small">{r.data.contacto.telefono || "Sin teléfono"}</div>
            <div className="t-small t-muted">Ref. {r.id}</div>
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor={`nt-${r.id}`}>Notas internas</label>
          <textarea id={`nt-${r.id}`} className="textarea" value={r.notes ?? ""} onChange={(e) => update(r.id, { notes: e.target.value })} placeholder="Seguimiento, llamadas, acuerdos…" />
        </div>
        <div>
          <span className="lbl">Destinos</span>
          <div className="flex flex-wrap gap-2">
            {r.data.destinos.map((d) => <span key={d.id} className="chip is-on">{d.nombre}</span>)}
          </div>
        </div>
        <div>
          <span className="lbl">Respuestas</span>
          <dl className="summary">
            {Object.entries(r.data.respuestas).map(([k, v]) => {
              const [l, t] = labelFor(steps, k, v);
              return (
                <div key={k}><dt>{l}</dt><dd>{t}</dd></div>
              );
            })}
          </dl>
        </div>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setComposing((v) => !v)}>
            {composing ? "Cerrar mensaje" : "Escribir al cliente"}
            <ArrowRight className="btn-icon" />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={download}>Descargar brief .txt</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openPreview(clientConfirmationEmail(r.id, r.data, brand))}>
            Ver correo de confirmación
          </button>
        </div>
        {composing ? (
          <MessageComposer
            key={r.id}
            request={r}
            brand={brand}
            onSent={(line) => update(r.id, { notes: `${r.notes ? `${r.notes}\n` : ""}Correo enviado · ${line}` })}
          />
        ) : (
          <div>
            <span className="lbl">Brief para el gestor</span>
            <pre className="pre">{brief}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
