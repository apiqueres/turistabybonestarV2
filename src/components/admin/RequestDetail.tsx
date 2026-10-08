"use client";

import { useState } from "react";
import type { RequestStatus, StoredRequest } from "@/types/admin";
import type { FormStep } from "@/types/form";
import type { EmailBrand } from "@/lib/email-shell";
import { buildPrompt } from "@/lib/prompt";
import { clientMessageEmail, defaultAdminMessage } from "@/lib/email-templates";
import { ArrowRight } from "@/components/ui/icons";
import { MessageComposer } from "./MessageComposer";
import type { RequestsStore } from "./sources";

export const STATUS: Record<RequestStatus, string> = { nueva: "Nueva", "en-curso": "En curso", cerrada: "Cerrada" };
const KIND: Record<string, string> = { confirmacion: "Confirmación al cliente", admin: "Mensaje del gestor", "aviso-agencia": "Aviso a la agencia" };
const fmt = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

interface Props {
  request: StoredRequest;
  steps: FormStep[];
  brand: EmailBrand;
  store: RequestsStore;
  onDeleted: () => void;
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

/** Everything about one request, rendered inline under its row: status, notes, answers, brief, e-mails and the composer. */
export function RequestDetail({ request: r, steps, brand, store, onDeleted }: Props) {
  const [composing, setComposing] = useState(false);
  const [notes, setNotes] = useState(r.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(r.notes ?? "");
  const [state, setState] = useState<string | null>(null);
  if ((r.notes ?? "") !== savedNotes) {
    // Notas recargadas del servidor.
    setSavedNotes(r.notes ?? "");
    setNotes(r.notes ?? "");
  }
  const brief = r.prompt ?? buildPrompt(r.id, r.createdAt, r.data);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    try {
      await fn();
      setState(ok ?? null);
    } catch (err) {
      setState(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  };
  const saveNotes = () => {
    if (notes === (r.notes ?? "")) return;
    void run(() => store.update(r.id, { notes }), "Notas guardadas.");
  };
  const copyBrief = () =>
    void run(async () => {
      await navigator.clipboard.writeText(brief);
    }, "Brief copiado al portapapeles.").catch(() => setState("No se pudo copiar; selecciona el texto y cópialo a mano."));
  const remove = () => {
    if (!window.confirm(`¿Eliminar definitivamente la solicitud de ${r.data.contacto.nombre}? Se borran sus datos personales y los correos registrados.`)) return;
    void run(async () => {
      await store.remove(r.id);
      onDeleted();
    });
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lbl" htmlFor={`st-${r.id}`}>Estado</label>
            <select id={`st-${r.id}`} className="select" value={r.status} onChange={(e) => void run(() => store.update(r.id, { status: e.target.value as RequestStatus }))}>
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
          <label className="lbl" htmlFor={`nt-${r.id}`}>Notas internas (se guardan al salir del campo)</label>
          <textarea id={`nt-${r.id}`} className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Seguimiento, llamadas, acuerdos…" />
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
        {r.messages && r.messages.length > 0 && (
          <div>
            <span className="lbl">Correos enviados</span>
            <ul className="t-small flex flex-col gap-1">
              {r.messages.map((m) => (
                <li key={m.id} className="flex gap-3 flex-wrap">
                  <span className="t-muted whitespace-nowrap">{fmt(m.createdAt)}</span>
                  <span>{KIND[m.kind] ?? m.kind} · {m.subject}</span>
                  <span className={`badge ${m.status === "sent" ? "nueva" : "cerrada"}`}>{m.status === "sent" ? "Enviado" : m.status === "skipped" ? "Sin SMTP" : "Error"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setComposing((v) => !v)}>
            {composing ? "Cerrar mensaje" : "Escribir al cliente"}
            <ArrowRight className="btn-icon" />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyBrief}>Copiar brief para el gestor</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={remove}>Eliminar solicitud</button>
          {state && <span className="form-status">{state}</span>}
        </div>
        {composing ? (
          <MessageComposer key={r.id} to={r.data.contacto.email} initial={defaultAdminMessage(r.data, brand)} render={(m) => clientMessageEmail(r.id, r.data, m, brand)} mode={store.mode} send={(msg) => store.sendMessage(r, msg, brand)} />
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
