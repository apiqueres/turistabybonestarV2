"use client";

import { Fragment, useMemo, useState } from "react";
import type { RequestStatus } from "@/data/mock-solicitudes";
import type { EmailBrand } from "@/lib/email-shell";
import { useRequests, useFormSteps } from "@/lib/admin/data";
import { canalLabel } from "@/lib/prompt";
import { RequestDetail, STATUS } from "./RequestDetail";
import { Pager, paginate } from "./Pager";

const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });

/** Paginated list of requests (10 per page); clicking a row opens its detail inline, below the row. */
export function RequestsAdmin({ brand }: { brand: EmailBrand }) {
  const { requests, update } = useRequests();
  const { steps } = useFormSteps();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilterState] = useState<RequestStatus | "todas">("todas");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (filter === "todas" ? requests : requests.filter((r) => r.status === filter)), [requests, filter]);
  const { rows, current } = paginate(filtered, page);

  const setFilter = (f: RequestStatus | "todas") => {
    setFilterState(f);
    setPage(1);
    setOpenId(null);
  };
  const goTo = (p: number) => {
    setPage(p);
    setOpenId(null);
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
            {rows.map((r) => {
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
                    <td>{String(r.data.respuestas.viajeros ?? "—")}</td>
                    <td>{canalLabel(r.data.contacto.canal)}</td>
                    <td><span className={`badge ${r.status}`}>{STATUS[r.status]}</span></td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <RequestDetail request={r} steps={steps} brand={brand} update={update} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="t-muted">No hay solicitudes con ese estado.</td></tr>
            )}
          </tbody>
        </table>
        <Pager total={filtered.length} page={current} onPage={goTo} />
      </div>
    </>
  );
}
