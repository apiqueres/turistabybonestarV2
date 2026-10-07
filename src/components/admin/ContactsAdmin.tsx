"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoredContact } from "@/types/admin";
import { api } from "@/lib/admin/api";
import { ArrowRight } from "@/components/ui/icons";
import { Pager } from "./Pager";

const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });

interface Props {
  rows: StoredContact[];
  total: number;
  page: number;
  pending: number;
  onlyPending: boolean;
}

/** Mensajes del formulario corto de contacto: listado paginado con detalle en línea. */
export function ContactsAdmin({ rows, total, page, pending, onlyPending }: Props) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const url = (p: number, pend: boolean) => `/admin/contactos${[p > 1 ? `page=${p}` : "", pend ? "pendientes=1" : ""].filter(Boolean).length ? `?${[p > 1 ? `page=${p}` : "", pend ? "pendientes=1" : ""].filter(Boolean).join("&")}` : ""}`;

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      router.refresh();
      setMsg(ok ?? null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  };
  const setHandled = (c: StoredContact, handled: boolean) => run(() => api(`/api/admin/contactos/${encodeURIComponent(c.id)}`, { method: "PATCH", body: { handled } }));
  const remove = (c: StoredContact) => {
    if (!window.confirm(`¿Eliminar el mensaje de ${c.data.nombre}?`)) return;
    void run(() => api(`/api/admin/contactos/${encodeURIComponent(c.id)}`, { method: "DELETE" }), "Mensaje eliminado.").then(() => setOpenId(null));
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Contactos</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg && <span className="form-status">{msg}</span>}
          <label className="check">
            <input type="checkbox" checked={onlyPending} onChange={(e) => router.push(url(1, e.target.checked))} />
            <span>Solo pendientes ({pending})</span>
          </label>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Mensaje</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isOpen = c.id === openId;
              return (
                <Fragment key={c.id}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => setOpenId(isOpen ? null : c.id)} aria-expanded={isOpen}>
                    <td className="whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                    <td>{c.data.nombre}</td>
                    <td className="break-all">{c.data.email}</td>
                    <td className="whitespace-nowrap">{c.data.telefono || "—"}</td>
                    <td className="t-muted">{c.data.mensaje.length > 70 ? `${c.data.mensaje.slice(0, 70)}…` : c.data.mensaje}</td>
                    <td>{c.handled ? <span className="badge cerrada">Atendido</span> : <span className="badge nueva">Pendiente</span>}</td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <div className="detail" style={{ gridTemplateColumns: "1fr" }}>
                          <div>
                            <span className="lbl">Mensaje</span>
                            <pre className="pre" style={{ whiteSpace: "pre-wrap" }}>{c.data.mensaje}</pre>
                          </div>
                          <div className="flex flex-wrap gap-3 items-center">
                            <a className="btn btn-primary btn-sm" href={`mailto:${encodeURIComponent(c.data.email)}?subject=${encodeURIComponent(`Re: tu mensaje a TuristaByBonestar`)}`}>
                              Responder por correo
                              <ArrowRight className="btn-icon" />
                            </a>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHandled(c, !c.handled)}>
                              {c.handled ? "Marcar pendiente" : "Marcar atendido"}
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => remove(c)}>Eliminar</button>
                            <span className="t-small t-muted">Ref. {c.id}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="t-muted">No hay mensajes.</td></tr>}
          </tbody>
        </table>
        <Pager total={total} page={page} onPage={(p) => { setOpenId(null); router.push(url(p, onlyPending)); }} />
      </div>
    </>
  );
}
