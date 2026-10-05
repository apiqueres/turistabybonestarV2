"use client";

import { useMemo, useState } from "react";
import type { StoredRequest, RequestStatus } from "@/data/mock-solicitudes";
import { useRequests, useFormSteps } from "@/lib/admin/data";
import { buildPrompt } from "@/lib/prompt";
import { sendDemoMail, emailJsConfigured } from "@/lib/email";
import { ArrowRight, Close } from "@/components/ui/icons";

const STATUS: Record<RequestStatus, string> = { nueva: "Nueva", "en-curso": "En curso", cerrada: "Cerrada" };
const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });

export function RequestsAdmin({ agencyEmail }: { agencyEmail: string }) {
  const { requests, update } = useRequests();
  const { steps } = useFormSteps();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestStatus | "todas">("todas");
  const [mailState, setMailState] = useState<string | null>(null);

  const list = useMemo(() => (filter === "todas" ? requests : requests.filter((r) => r.status === filter)), [requests, filter]);
  const open = requests.find((r) => r.id === openId) ?? null;

  const labelFor = (qid: string, value: unknown): readonly [string, string] => {
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
  };

  const brief = (r: StoredRequest) => buildPrompt(r.id, r.createdAt, r.data);
  const download = (r: StoredRequest) => {
    const url = URL.createObjectURL(new Blob([brief(r)], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const mail = async (r: StoredRequest) => {
    try {
      const how = await sendDemoMail({
        to: r.data.contacto.email,
        subject: `Tu propuesta de viaje · ${r.data.destinos.map((d) => d.nombre).join(", ")}`,
        text: brief(r),
        replyTo: agencyEmail,
        fromName: "TuristaByBonestar",
      });
      setMailState(how === "sent" ? "Correo enviado." : "Se ha abierto tu cliente de correo con el brief.");
    } catch {
      setMailState("No se pudo enviar el correo.");
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Solicitudes</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="lbl mb-0" htmlFor="flt">Estado</label>
          <select id="flt" className="select" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value as RequestStatus | "todas")}>
            <option value="todas">Todas ({requests.length})</option>
            {(Object.keys(STATUS) as RequestStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s]} ({requests.filter((r) => r.status === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Cliente</th><th>Destinos</th><th>Viajeros</th><th>Canal</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="is-clickable" onClick={() => setOpenId(r.id)}>
                <td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                <td>
                  <div>{r.data.contacto.nombre}</div>
                  <div className="t-muted">{r.data.contacto.email}</div>
                </td>
                <td>{r.data.destinos.map((d) => d.nombre).join(", ")}</td>
                <td>{String(r.data.respuestas.viajeros ?? "—")}</td>
                <td>{labelFor("canal", r.data.contacto.canal || "igual")[1]}</td>
                <td><span className={`badge ${r.status}`}>{STATUS[r.status]}</span></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="t-muted">No hay solicitudes con ese estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`panel-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpenId(null)} aria-hidden />
      <aside className={`admin-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        {open && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="kicker">{fmtDate(open.createdAt)}</div>
                <h2 className="t-h3 mt-1">{open.data.contacto.nombre}</h2>
                <div className="t-small t-muted break-all">{open.id}</div>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Cerrar"><Close width={22} height={22} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="lbl" htmlFor="st">Estado</label>
                <select id="st" className="select" value={open.status} onChange={(e) => update(open.id, { status: e.target.value as RequestStatus })}>
                  {(Object.keys(STATUS) as RequestStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="lbl">Contacto</span>
                <div className="t-small">{open.data.contacto.email}</div>
                <div className="t-small">{open.data.contacto.telefono || "Sin teléfono"}</div>
              </div>
            </div>
            <div>
              <label className="lbl" htmlFor="nt">Notas internas</label>
              <textarea id="nt" className="textarea" value={open.notes ?? ""} onChange={(e) => update(open.id, { notes: e.target.value })} placeholder="Seguimiento, llamadas, acuerdos…" />
            </div>
            <div>
              <span className="lbl">Destinos</span>
              <div className="flex flex-wrap gap-2">
                {open.data.destinos.map((d) => <span key={d.id} className="chip is-on">{d.nombre}</span>)}
              </div>
            </div>
            <div>
              <span className="lbl">Respuestas</span>
              <dl className="summary">
                {Object.entries(open.data.respuestas).map(([k, v]) => {
                  const [l, t] = labelFor(k, v);
                  return (
                    <div key={k}><dt>{l}</dt><dd>{t}</dd></div>
                  );
                })}
              </dl>
            </div>
            <div>
              <span className="lbl">Brief para el gestor</span>
              <pre className="pre">{brief(open)}</pre>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => download(open)}>Descargar .txt</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => mail(open)}>
                {emailJsConfigured ? "Enviar brief al cliente" : "Enviar por correo"}
                <ArrowRight className="btn-icon" />
              </button>
              {mailState && <span className="form-status">{mailState}</span>}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
