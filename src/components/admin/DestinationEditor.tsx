"use client";

import { useEffect, useState } from "react";
import type { Destination } from "@/types/content";
import { pickImage } from "@/lib/admin/image";
import { asset } from "@/lib/config";
import { loadMapCountries, type MapCountry } from "@/lib/geo/countries";
import { slugify } from "@/lib/slug";
import { ArrowRight } from "@/components/ui/icons";
import { CARD_RATIO, ImageCropDialog } from "./ImageCropDialog";

export const EMPTY_DESTINATION: Destination = { id: "", slug: "", name: "", code: "", region: "", lon: 0, lat: 0, tagline: "", bestSeason: "", duration: "", idealFor: "", badge: "", includes: [], image: { src: "", alt: "" }, featured: false };
export const imgSrc = (src: string) => (src.startsWith("data:") || !src ? src : asset(src));

interface Props {
  initial: Destination;
  isNew?: boolean;
  onSave: (d: Destination) => void;
  onDelete?: () => void;
  onCancel: () => void;
  /** Mueve la ficha una posición arriba (-1) o abajo (1) en el orden de la web. */
  onMove?: (dir: -1 | 1) => void;
  /** "db": las imágenes se suben al servidor; "demo": se guardan como data: URL en el navegador. */
  mode?: "db" | "demo";
  /** Países (id del mapa) ya usados por otros destinos, con su nombre: el mapa solo admite un destino por país. */
  taken?: Map<string, string>;
}

const FIELDS: [keyof Destination, string][] = [
  ["name", "Nombre"], ["code", "Código"], ["region", "Región"],
  ["bestSeason", "Cuándo ir"], ["duration", "Duración ideal"], ["idealFor", "Perfecto para"], ["badge", "Etiqueta (opcional)"],
];

/** Inline editor for one destination (rendered under its row). */
export function DestinationEditor({ initial, isNew, onSave, onDelete, onCancel, onMove, mode = "demo", taken }: Props) {
  const [d, setD] = useState<Destination>({ ...initial, includes: [...initial.includes] });
  const [msg, setMsg] = useState<string | null>(null);
  const field = <K extends keyof Destination>(k: K, v: Destination[K]) => setD((x) => ({ ...x, [k]: v }));
  const [countries, setCountries] = useState<MapCountry[]>([]);
  useEffect(() => {
    let alive = true;
    loadMapCountries().then((l) => alive && setCountries(l));
    return () => { alive = false; };
  }, []);
  // El país fija el id del mapa (ISO numérico), las coordenadas y, si está vacío, el código.
  const pickCountry = (id: string) => {
    const c = countries.find((x) => x.id === id);
    if (!c) return field("id", "");
    setD((x) => ({ ...x, id: c.id, lon: c.lon, lat: c.lat, code: x.code || c.code }));
  };
  // La foto elegida pasa por el diálogo de recorte antes de subirse.
  const [pending, setPending] = useState<File | null>(null);
  const uploadCropped = async (file: File) => {
    const src = await pickImage(file, mode, d.image.alt || d.name);
    field("image", { ...d.image, src });
    setMsg(null);
    return imgSrc(src);
  };
  const save = () => {
    if (!d.name.trim()) return setMsg("Falta el nombre.");
    if (!d.id) return setMsg("Elige el país en el mapa.");
    const other = taken?.get(d.id);
    if (other && d.id !== initial.id) return setMsg(`Ya hay un destino en ese país («${other}»); el mapa solo admite uno por país.`);
    const slug = slugify(d.name);
    if (!slug) return setMsg("El nombre necesita alguna letra o número.");
    onSave({ ...d, name: d.name.trim(), slug, includes: d.includes.map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-4 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {d.image.src ? <img className="thumb" src={imgSrc(d.image.src)} alt={d.image.alt} /> : <div className="thumb" />}
        <div>
          <label className="lbl" htmlFor={`img-${initial.id || "new"}`}>Imagen (JPG/PNG/WebP)</label>
          <input id={`img-${initial.id || "new"}`} type="file" accept="image/*" onChange={(e) => { setPending(e.target.files?.[0] ?? null); e.target.value = ""; }} className="t-small" />
          {pending && <ImageCropDialog file={pending} ratios={CARD_RATIO} upload={uploadCropped} onClose={() => setPending(null)} />}
        </div>
        <div>
          <label className="lbl" htmlFor={`alt-${initial.id || "new"}`}>Texto alternativo</label>
          <input id={`alt-${initial.id || "new"}`} className="input" value={d.image.alt} onChange={(e) => field("image", { ...d.image, alt: e.target.value })} />
        </div>
        <label className="check">
          <input type="checkbox" checked={Boolean(d.featured)} onChange={(e) => field("featured", e.target.checked)} />
          <span>Mostrar en la portada</span>
        </label>
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map(([k, l]) => (
            <div key={k}>
              <label className="lbl" htmlFor={`f-${k}-${initial.id || "new"}`}>{l}</label>
              <input id={`f-${k}-${initial.id || "new"}`} className="input" value={String(d[k] ?? "")} onChange={(e) => field(k, e.target.value as never)} />
            </div>
          ))}
          <div>
            <label className="lbl" htmlFor={`country-${initial.id || "new"}`}>País en el mapa</label>
            <select id={`country-${initial.id || "new"}`} className="select" value={countries.some((c) => c.id === d.id) ? d.id : ""} onChange={(e) => pickCountry(e.target.value)} disabled={countries.length === 0}>
              <option value="">{countries.length === 0 ? "Cargando países…" : "Elige un país"}</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor={`tag-${initial.id || "new"}`}>Frase</label>
          <input id={`tag-${initial.id || "new"}`} className="input" value={d.tagline} onChange={(e) => field("tagline", e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor={`inc-${initial.id || "new"}`}>Qué incluye (una línea por punto)</label>
          <textarea id={`inc-${initial.id || "new"}`} className="textarea" value={d.includes.join("\n")} onChange={(e) => field("includes", e.target.value.split("\n"))} />
        </div>
        <div className="flex flex-wrap gap-3 items-center rule pt-4">
          <button type="button" className="btn btn-primary btn-sm" onClick={save}>
            {isNew ? "Crear destino" : "Guardar"}
            <ArrowRight className="btn-icon" />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
          {onDelete && <button type="button" className="btn btn-secondary btn-sm" onClick={onDelete}>Eliminar</button>}
          {onMove && (
            <span className="flex gap-2 items-center">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMove(-1)} aria-label="Subir en el orden">↑</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMove(1)} aria-label="Bajar en el orden">↓</button>
            </span>
          )}
          {msg && <span className="form-status">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
