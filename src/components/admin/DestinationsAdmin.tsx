"use client";

import { Fragment, useState } from "react";
import type { Destination } from "@/types/content";
import { useDestinations } from "@/lib/admin/data";
import { DestinationEditor, EMPTY_DESTINATION, imgSrc } from "./DestinationEditor";
import { Pager, paginate } from "./Pager";

/** Destinations as a paginated table; each row opens its editor inline. */
export function DestinationsAdmin() {
  const { destinations, save, reset, dirty, hydrated } = useDestinations();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const { rows, current } = paginate(destinations, page);

  const persist = (d: Destination) => {
    const exists = destinations.some((x) => x.id === d.id);
    save(exists ? destinations.map((x) => (x.id === d.id ? d : x)) : [...destinations, d]);
    setOpenId(null);
    setAdding(false);
    setMsg(`«${d.name}» guardado en este navegador.`);
  };
  const remove = (id: string) => {
    save(destinations.filter((x) => x.id !== id));
    setOpenId(null);
  };

  if (!hydrated) return null;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Destinos</h1>
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="form-status">{msg}</span>}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setAdding((v) => !v); setOpenId(null); }}>
            {adding ? "Cancelar alta" : "Añadir destino"}
          </button>
          {dirty && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { reset(); setOpenId(null); setMsg("Restablecidos los valores originales."); }}>Restablecer</button>}
        </div>
      </div>
      <div className="card overflow-x-auto">
        {adding && (
          <DestinationEditor key="new" initial={EMPTY_DESTINATION} isNew onSave={persist} onCancel={() => setAdding(false)} />
        )}
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 64 }}></th><th>Destino</th><th>Región</th><th>Código</th><th>Duración</th><th>Portada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const isOpen = d.id === openId;
              return (
                <Fragment key={d.id}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => { setOpenId(isOpen ? null : d.id); setAdding(false); }} aria-expanded={isOpen}>
                    <td>{/* eslint-disable-next-line @next/next/no-img-element */}
                      {d.image.src ? <img src={imgSrc(d.image.src)} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} /> : null}
                    </td>
                    <td>
                      <div>{d.name}</div>
                      <div className="t-muted">{d.tagline}</div>
                    </td>
                    <td>{d.region}</td>
                    <td>{d.code}</td>
                    <td className="whitespace-nowrap">{d.duration}</td>
                    <td>{d.featured ? <span className="badge nueva">Sí</span> : <span className="badge">No</span>}</td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <DestinationEditor key={d.id} initial={d} onSave={persist} onDelete={() => remove(d.id)} onCancel={() => setOpenId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <Pager total={destinations.length} page={current} onPage={(p) => { setPage(p); setOpenId(null); }} />
      </div>
    </>
  );
}
