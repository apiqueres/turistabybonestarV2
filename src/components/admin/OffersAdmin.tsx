"use client";

import { Fragment, useState } from "react";
import type { Destination, Offer } from "@/types/content";
import { useDestinations, useOffers } from "@/lib/admin/data";
import { OfferEditor, EMPTY_OFFER } from "./OfferEditor";
import { imgSrc } from "./DestinationEditor";
import { Pager, paginate } from "./Pager";

/** Seasonal offers as a paginated table; each row opens its editor inline. */
export function OffersAdmin() {
  const { offers, save, reset, dirty, hydrated } = useOffers();
  const { destinations } = useDestinations();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const { rows, current } = paginate(offers, page);
  const destName = (slug: string) => destinations.find((d: Destination) => d.slug === slug)?.name ?? slug;

  const persist = (o: Offer) => {
    const exists = offers.some((x) => x.id === o.id);
    save(exists ? offers.map((x) => (x.id === o.id ? o : x)) : [o, ...offers]);
    setOpenId(null);
    setAdding(false);
    setMsg(`«${o.title}» guardada en este navegador. La página de ofertas ya la muestra.`);
  };
  const remove = (id: string) => {
    save(offers.filter((x) => x.id !== id));
    setOpenId(null);
  };

  if (!hydrated) return null;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Ofertas</h1>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {msg && <span className="form-status">{msg}</span>}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setAdding((v) => !v); setOpenId(null); }}>
            {adding ? "Cancelar alta" : "Nueva oferta"}
          </button>
          {dirty && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { reset(); setOpenId(null); setMsg("Restablecidas las ofertas originales."); }}>Restablecer</button>}
        </div>
      </div>
      <div className="card overflow-x-auto">
        {adding && <OfferEditor key="new" initial={EMPTY_OFFER} destinations={destinations} isNew onSave={persist} onCancel={() => setAdding(false)} />}
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 64 }}></th><th>Oferta</th><th>Destino</th><th>Precio</th><th>Fechas</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const isOpen = o.id === openId;
              return (
                <Fragment key={o.id}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => { setOpenId(isOpen ? null : o.id); setAdding(false); }} aria-expanded={isOpen}>
                    <td>{/* eslint-disable-next-line @next/next/no-img-element */}
                      {o.image.src ? <img src={imgSrc(o.image.src)} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} /> : null}
                    </td>
                    <td>
                      <div>{o.title}</div>
                      <div className="t-muted">{o.duration}</div>
                    </td>
                    <td>{destName(o.destinationId)}</td>
                    <td className="whitespace-nowrap">{o.price}</td>
                    <td>{o.dates}</td>
                    <td>{o.active ? <span className="badge nueva">Activa</span> : <span className="badge cerrada">Oculta</span>}</td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <OfferEditor key={o.id} initial={o} destinations={destinations} onSave={persist} onDelete={() => remove(o.id)} onCancel={() => setOpenId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="t-muted">No hay ofertas. Crea la primera con «Nueva oferta».</td></tr>}
          </tbody>
        </table>
        <Pager total={offers.length} page={current} onPage={(p) => { setPage(p); setOpenId(null); }} />
      </div>
    </>
  );
}
