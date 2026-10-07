"use client";

import { useState } from "react";
import type { Destination } from "@/types/content";
import { pickImage } from "@/lib/admin/image";
import { asset } from "@/lib/config";
import { ArrowRight } from "@/components/ui/icons";

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
}

const FIELDS: [keyof Destination, string][] = [
  ["name", "Nombre"], ["id", "Id (ISO numérico)"], ["code", "Código"], ["region", "Región"],
  ["bestSeason", "Cuándo ir"], ["duration", "Duración ideal"], ["idealFor", "Perfecto para"], ["badge", "Etiqueta (opcional)"], ["slug", "Slug"],
];

/** Inline editor for one destination (rendered under its row). */
export function DestinationEditor({ initial, isNew, onSave, onDelete, onCancel, onMove, mode = "demo" }: Props) {
  const [d, setD] = useState<Destination>({ ...initial, includes: [...initial.includes] });
  const [msg, setMsg] = useState<string | null>(null);
  const field = <K extends keyof Destination>(k: K, v: Destination[K]) => setD((x) => ({ ...x, [k]: v }));
  const [uploading, setUploading] = useState(false);
  const onImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      field("image", { ...d.image, src: await pickImage(file, mode, d.image.alt || d.name) });
      setMsg(null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    } finally {
      setUploading(false);
    }
  };
  const save = () => {
    if (!d.id || !d.name) return setMsg("Faltan el id (código ISO numérico) y el nombre.");
    onSave(d);
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-4 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {d.image.src ? <img className="thumb" src={imgSrc(d.image.src)} alt={d.image.alt} /> : <div className="thumb" />}
        <div>
          <label className="lbl" htmlFor={`img-${initial.id || "new"}`}>Imagen (JPG/PNG/WebP)</label>
          <input id={`img-${initial.id || "new"}`} type="file" accept="image/*" disabled={uploading} onChange={(e) => onImage(e.target.files?.[0])} className="t-small" />
          {uploading && <span className="t-small t-muted">Subiendo…</span>}
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
            <label className="lbl" htmlFor={`lon-${initial.id || "new"}`}>Longitud</label>
            <input id={`lon-${initial.id || "new"}`} className="input" type="number" step="0.1" value={d.lon} onChange={(e) => field("lon", Number(e.target.value))} />
          </div>
          <div>
            <label className="lbl" htmlFor={`lat-${initial.id || "new"}`}>Latitud</label>
            <input id={`lat-${initial.id || "new"}`} className="input" type="number" step="0.1" value={d.lat} onChange={(e) => field("lat", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor={`tag-${initial.id || "new"}`}>Frase</label>
          <input id={`tag-${initial.id || "new"}`} className="input" value={d.tagline} onChange={(e) => field("tagline", e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor={`inc-${initial.id || "new"}`}>Qué incluye (una línea por punto)</label>
          <textarea id={`inc-${initial.id || "new"}`} className="textarea" value={d.includes.join("\n")} onChange={(e) => field("includes", e.target.value.split("\n").filter(Boolean))} />
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
