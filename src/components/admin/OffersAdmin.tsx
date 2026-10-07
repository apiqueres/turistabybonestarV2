"use client";

import { Fragment, useState } from "react";
import type { Destination, Offer } from "@/types/content";
import type { ListStore } from "./sources";
import { OfferEditor, EMPTY_OFFER } from "./OfferEditor";
import { imgSrc } from "./DestinationEditor";
import { Pager, paginate } from "./Pager";

/** Seasonal offers as a paginated table; each row opens its editor inline. */
export function OffersAdmin({ store, destinations }: { store: ListStore<Offer>; destinations: Destination[] }) {
  const offers = store.items;
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const { rows, current } = paginate(offers, page);
  const destName = (slug: string) => destinations.find((d: Destination) => d.slug === slug)?.name ?? slug;
  const where = store.mode === "demo" ? " en este navegador" : "";

  const persist = async (o: Offer) => {
    try {
      await store.save(o);
      setOpenId(null);
      setAdding(false);
      setMsg(`«${o.title}» guardada${where}. La página de ofertas ya la muestra.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  };
  const remove = async (o: Offer) => {
    if (!window.confirm(`¿Eliminar la oferta «${o.title}»?`)) return;
    try {
      await store.remove(o.id);
      setOpenId(null);
      setMsg(`«${o.title}» eliminada${where}.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };
  const move = async (id: string, dir: -1 | 1) => {
    const ids = offers.map((x) => x.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await store.reorder(ids);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo reordenar.");
    }
  };

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
          {store.dirty && store.reset && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { store.reset?.(); setOpenId(null); setMsg("Restablecidas las ofertas originales."); }}>Restablecer</button>}
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
                        <OfferEditor key={o.id} initial={o} destinations={destinations} onSave={persist} onDelete={() => remove(o)} onCancel={() => setOpenId(null)} onMove={(dir) => move(o.id, dir)} />
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
