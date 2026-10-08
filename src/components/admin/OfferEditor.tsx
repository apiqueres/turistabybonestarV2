"use client";

import { useState } from "react";
import type { Destination, Offer } from "@/types/content";
import { pickImage } from "@/lib/admin/image";
import { imgSrc } from "./DestinationEditor";
import { slugify } from "@/lib/slug";
import { ArrowRight } from "@/components/ui/icons";

export const EMPTY_OFFER: Offer = { id: "", title: "", destinationId: "", price: "", priceNote: "por persona", dates: "", duration: "", text: "", includes: [], image: { src: "", alt: "" }, badge: "", promo: false, promoText: "", active: true };

interface Props {
  initial: Offer;
  destinations: Destination[];
  isNew?: boolean;
  onSave: (o: Offer) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onMove?: (dir: -1 | 1) => void;
  mode?: "db" | "demo";
}


/** Inline editor for one seasonal offer. */
export function OfferEditor({ initial, destinations, isNew, onSave, onDelete, onCancel, onMove, mode = "demo" }: Props) {
  const [o, setO] = useState<Offer>({ ...initial, includes: [...initial.includes] });
  const [msg, setMsg] = useState<string | null>(null);
  const k = initial.id || "new";
  const field = <K extends keyof Offer>(key: K, v: Offer[K]) => setO((x) => ({ ...x, [key]: v }));
  const pickDestination = (slugId: string) => {
    const d = destinations.find((x) => x.slug === slugId);
    setO((x) => ({ ...x, destinationId: slugId, image: x.image.src || !d ? x.image : { ...d.image } }));
  };
  const [uploading, setUploading] = useState(false);
  const onImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      field("image", { ...o.image, src: await pickImage(file, mode, o.image.alt || o.title) });
      setMsg(null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    } finally {
      setUploading(false);
    }
  };
  const save = () => {
    if (!o.title || !o.price || !o.destinationId) return setMsg("Faltan el título, el precio y el destino.");
    onSave({ ...o, id: o.id || slugify(o.title) || `oferta-${Date.now()}` });
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-4 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {o.image.src ? <img className="thumb" src={imgSrc(o.image.src)} alt={o.image.alt} /> : <div className="thumb" />}
        <div>
          <label className="lbl" htmlFor={`oimg-${k}`}>Imagen (si no subes ninguna se usa la del destino)</label>
          <input id={`oimg-${k}`} type="file" accept="image/*" disabled={uploading} onChange={(e) => onImage(e.target.files?.[0])} className="t-small" />
          {uploading && <span className="t-small t-muted">Subiendo…</span>}
        </div>
        <div>
          <label className="lbl" htmlFor={`oalt-${k}`}>Texto alternativo</label>
          <input id={`oalt-${k}`} className="input" value={o.image.alt} onChange={(e) => field("image", { ...o.image, alt: e.target.value })} />
        </div>
        <label className="check">
          <input type="checkbox" checked={o.active} onChange={(e) => field("active", e.target.checked)} />
          <span>Oferta activa (visible en la web)</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={o.promo} onChange={(e) => field("promo", e.target.checked)} />
          <span>Mostrar como aviso en la portada (solo puede haber una)</span>
        </label>
        {o.promo && (
          <div>
            <label className="lbl" htmlFor={`opt-${k}`}>Texto del aviso</label>
            <input
              id={`opt-${k}`}
              className="input"
              value={o.promoText ?? ""}
              onChange={(e) => field("promoText", e.target.value)}
              placeholder={`Si lo dejas vacío: «${o.title || "Título"} · desde ${o.price || "Precio"}»`}
            />
            {!o.active && <span className="t-small t-muted">La oferta está oculta: el aviso no saldrá hasta que la actives.</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="lbl" htmlFor={`ot-${k}`}>Título</label>
            <input id={`ot-${k}`} className="input" value={o.title} onChange={(e) => field("title", e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor={`od-${k}`}>Destino</label>
            <select id={`od-${k}`} className="select" value={o.destinationId} onChange={(e) => pickDestination(e.target.value)}>
              <option value="">Elige un destino</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl" htmlFor={`ob-${k}`}>Etiqueta (opcional)</label>
            <input id={`ob-${k}`} className="input" value={o.badge ?? ""} onChange={(e) => field("badge", e.target.value)} placeholder="Temporada, Puentes…" />
          </div>
          <div>
            <label className="lbl" htmlFor={`op-${k}`}>Precio</label>
            <input id={`op-${k}`} className="input" value={o.price} onChange={(e) => field("price", e.target.value)} placeholder="1.290 €" />
          </div>
          <div>
            <label className="lbl" htmlFor={`opn-${k}`}>Nota del precio</label>
            <input id={`opn-${k}`} className="input" value={o.priceNote} onChange={(e) => field("priceNote", e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor={`odt-${k}`}>Fechas</label>
            <input id={`odt-${k}`} className="input" value={o.dates} onChange={(e) => field("dates", e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor={`odu-${k}`}>Duración</label>
            <input id={`odu-${k}`} className="input" value={o.duration} onChange={(e) => field("duration", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="lbl" htmlFor={`otx-${k}`}>Texto</label>
            <textarea id={`otx-${k}`} className="textarea" value={o.text} onChange={(e) => field("text", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="lbl" htmlFor={`oin-${k}`}>Qué incluye (una línea por punto)</label>
            <textarea id={`oin-${k}`} className="textarea" value={o.includes.join("\n")} onChange={(e) => field("includes", e.target.value.split("\n").filter(Boolean))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center rule pt-4">
          <button type="button" className="btn btn-primary btn-sm" onClick={save}>{isNew ? "Crear oferta" : "Guardar"}<ArrowRight className="btn-icon" /></button>
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
