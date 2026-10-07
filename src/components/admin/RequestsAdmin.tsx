"use client";

import { Fragment, useState } from "react";
import type { FormStep } from "@/types/form";
import type { EmailBrand } from "@/lib/email-shell";
import type { RequestFilter, RequestsStore } from "./sources";
import { RequestDetail, STATUS } from "./RequestDetail";
import { Pager } from "./Pager";
import type { RequestStatus } from "@/types/admin";

const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });

interface Props {
  store: RequestsStore;
  steps: FormStep[];
  brand: EmailBrand;
}

/** Paginated list of requests (10 per page) with status and text filters; clicking a row opens its detail inline. */
export function RequestsAdmin({ store, steps, brand }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState(store.q);
  const [prevQ, setPrevQ] = useState(store.q);
  if (store.q !== prevQ) {
    // La URL cambió (navegación): el cuadro de búsqueda se alinea con ella.
    setPrevQ(store.q);
    setQ(store.q);
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenId(null);
    store.setQuery(q.trim());
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Solicitudes</h1>
        </div>
        <form className="flex items-center gap-3 flex-wrap" onSubmit={submitSearch}>
          <input className="input" style={{ width: 220 }} placeholder="Buscar nombre, correo, destino…" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="lbl mb-0" htmlFor="flt">Estado</label>
          <select id="flt" className="select" style={{ width: "auto" }} value={store.filter} onChange={(e) => { setOpenId(null); store.setFilter(e.target.value as RequestFilter); }}>
            <option value="todas">Todas ({store.counts.todas})</option>
            {(Object.keys(STATUS) as RequestStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s]} ({store.counts[s]})
              </option>
            ))}
          </select>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Cliente</th><th>Destinos</th><th>Viajeros</th><th>Teléfono</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {store.rows.map((r) => {
              const isOpen = r.id === openId;
              return (
                <Fragment key={r.id}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => setOpenId(isOpen ? null : r.id)} aria-expanded={isOpen}>
                    <td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td>
                      <div>{r.data.contacto.nombre}</div>
                      <div className="t-muted">{r.data.contacto.email}</div>
                    </td>
                    <td>{r.data.destinos.map((d) => d.nombre).join(", ")}</td>
                    <td>{Number(r.data.respuestas.adultos ?? 0) + Number(r.data.respuestas.ninos ?? 0) || "—"}</td>
                    <td className="whitespace-nowrap">{r.data.contacto.telefono || "—"}</td>
                    <td><span className={`badge ${r.status}`}>{STATUS[r.status]}</span></td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <RequestDetail request={r} steps={steps} brand={brand} store={store} onDeleted={() => setOpenId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {store.rows.length === 0 && (
              <tr><td colSpan={6} className="t-muted">No hay solicitudes con ese filtro.</td></tr>
            )}
          </tbody>
        </table>
        <Pager total={store.total} page={store.page} onPage={(p) => { setOpenId(null); store.setPage(p); }} />
      </div>
    </>
  );
}
