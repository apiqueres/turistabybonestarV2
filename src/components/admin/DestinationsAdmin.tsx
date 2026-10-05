"use client";

import { useState } from "react";
import type { Destination } from "@/types/content";
import { useDestinations } from "@/lib/admin/data";
import { fileToDataUrl } from "@/lib/admin/image";
import { asset } from "@/lib/config";
import { ArrowRight } from "@/components/ui/icons";

const EMPTY: Destination = { id: "", slug: "", name: "", code: "", region: "", lon: 0, lat: 0, tagline: "", bestSeason: "", flight: "", duration: "", includes: [], image: { src: "", alt: "" }, featured: false };

export function DestinationsAdmin() {
  const { destinations, save, reset, dirty, hydrated } = useDestinations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Destination | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = destinations.find((d) => d.id === selectedId) ?? null;
  const select = (d: Destination | null) => {
    setSelectedId(d?.id ?? null);
    setDraft(d ? { ...d, includes: [...d.includes] } : null);
    setMsg(null);
  };

  const field = <K extends keyof Destination>(k: K, v: Destination[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const persist = () => {
    if (!draft) return;
    if (!draft.id || !draft.name) return setMsg("Faltan el id (código ISO numérico) y el nombre.");
    const exists = destinations.some((d) => d.id === draft.id);
    const next = exists ? destinations.map((d) => (d.id === draft.id ? draft : d)) : [...destinations, draft];
    save(next);
    setSelectedId(draft.id);
    setMsg("Guardado en este navegador.");
  };
  const remove = () => {
    if (!selected) return;
    save(destinations.filter((d) => d.id !== selected.id));
    select(null);
  };
  const onImage = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      field("image", { ...draft.image, src: await fileToDataUrl(file) });
    } catch {
      setMsg("No se pudo cargar la imagen.");
    }
  };

  if (!hydrated) return null;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Destinos</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelectedId(null); setDraft({ ...EMPTY }); setMsg(null); }}>Añadir destino</button>
          {dirty && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { reset(); select(null); setMsg("Restablecidos los valores originales."); }}>Restablecer</button>}
        </div>
      </div>
      <div className="admin-list">
        <div className="card">
          {destinations.map((d) => (
            <button key={d.id} type="button" className={`admin-item ${d.id === selectedId ? "is-active" : ""}`} onClick={() => select(d)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image.src.startsWith("data:") ? d.image.src : asset(d.image.src)} alt="" />
              <span className="flex-1">{d.name}</span>
              {d.featured && <span className="badge">Portada</span>}
            </button>
          ))}
        </div>
        {draft ? (
          <div className="card card-pad flex flex-col gap-5">
            <div className="grid md:grid-cols-[220px_1fr] gap-5">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {draft.image.src ? <img className="thumb" src={draft.image.src.startsWith("data:") ? draft.image.src : asset(draft.image.src)} alt={draft.image.alt} /> : <div className="thumb" />}
                <label className="lbl mt-3" htmlFor="img">Imagen (JPG/PNG/WebP)</label>
                <input id="img" type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} className="t-small" />
                <label className="lbl mt-3" htmlFor="alt">Texto alternativo</label>
                <input id="alt" className="input" value={draft.image.alt} onChange={(e) => field("image", { ...draft.image, alt: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {([["name", "Nombre"], ["id", "Id (ISO numérico)"], ["code", "Código"], ["region", "Región"], ["bestSeason", "Mejor época"], ["flight", "Vuelo desde Valencia"], ["duration", "Duración sugerida"], ["slug", "Slug"]] as [keyof Destination, string][]).map(([k, l]) => (
                  <div key={k}>
                    <label className="lbl" htmlFor={`f-${k}`}>{l}</label>
                    <input id={`f-${k}`} className="input" value={String(draft[k] ?? "")} onChange={(e) => field(k, e.target.value as never)} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="lbl" htmlFor="f-tagline">Frase</label>
                  <input id="f-tagline" className="input" value={draft.tagline} onChange={(e) => field("tagline", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="lbl" htmlFor="f-inc">Qué incluye (una línea por punto)</label>
                  <textarea id="f-inc" className="textarea" value={draft.includes.join("\n")} onChange={(e) => field("includes", e.target.value.split("\n").filter(Boolean))} />
                </div>
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div><label className="lbl" htmlFor="f-lon">Longitud</label><input id="f-lon" className="input" type="number" step="0.1" value={draft.lon} onChange={(e) => field("lon", Number(e.target.value))} /></div>
                  <div><label className="lbl" htmlFor="f-lat">Latitud</label><input id="f-lat" className="input" type="number" step="0.1" value={draft.lat} onChange={(e) => field("lat", Number(e.target.value))} /></div>
                </div>
                <label className="check col-span-2"><input type="checkbox" checked={Boolean(draft.featured)} onChange={(e) => field("featured", e.target.checked)} /><span>Mostrar en la portada</span></label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center rule pt-5">
              <button type="button" className="btn btn-primary btn-sm" onClick={persist}>Guardar<ArrowRight className="btn-icon" /></button>
              {selected && <button type="button" className="btn btn-secondary btn-sm" onClick={remove}>Eliminar</button>}
              {msg && <span className="form-status">{msg}</span>}
            </div>
          </div>
        ) : (
          <div className="card card-pad t-muted">Elige un destino de la lista o añade uno nuevo.</div>
        )}
      </div>
    </>
  );
}
