"use client";

import { useState } from "react";
import type { Destination, Offer } from "@/types/content";
import { pickImage } from "@/lib/admin/image";
import { imgSrc } from "./DestinationEditor";
import { CARD_RATIO, ImageCropDialog } from "./ImageCropDialog";
import { slugify } from "@/lib/slug";
import { ArrowRight } from "@/components/ui/icons";

export const EMPTY_OFFER: Offer = { id: "", title: "", destination: "", price: "", priceNote: "por persona", dates: "", duration: "", text: "", includes: [], image: { src: "", alt: "" }, badge: "", promo: false, promoText: "", active: true };

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
  /** Texto libre; si coincide con un destino de la web (nombre o slug) se enlaza a su ficha y se toma su imagen. */
  const setDestination = (text: string) => {
    const needle = text.trim().toLowerCase();
    const d = needle ? destinations.find((x) => x.name.toLowerCase() === needle || x.slug === needle) : undefined;
    setO((x) => ({
      ...x,
      destination: text,
      destinationId: d?.slug,
      image: x.image.src ? x.image : d ? { ...d.image } : x.image,
    }));
  };
  // La foto elegida pasa por el diálogo de recorte antes de subirse.
  const [pending, setPending] = useState<File | null>(null);
  const uploadCropped = async (file: File) => {
    const src = await pickImage(file, mode, o.image.alt || o.title);
    field("image", { ...o.image, src });
    setMsg(null);
    return imgSrc(src);
  };
  const save = () => {
    if (!o.title.trim() || !o.price.trim() || !o.destination.trim()) return setMsg("Faltan campos por rellenar: título, destino y precio son obligatorios.");
    onSave({ ...o, id: o.id || slugify(o.title) || `oferta-${Date.now()}`, includes: o.includes.map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div className="detail">
      <div className="flex flex-col gap-4 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {o.image.src ? <img className="thumb" src={imgSrc(o.image.src)} alt={o.image.alt} /> : <div className="thumb" />}
        <div>
          <label className="lbl" htmlFor={`oimg-${k}`}>Imagen (si no subes ninguna se usa la del destino)</label>
          <input id={`oimg-${k}`} type="file" accept="image/*" onChange={(e) => { setPending(e.target.files?.[0] ?? null); e.target.value = ""; }} className="t-small" />
          {pending && <ImageCropDialog file={pending} ratios={CARD_RATIO} upload={uploadCropped} onClose={() => setPending(null)} />}
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
            <input id={`od-${k}`} className="input" list={`odl-${k}`} value={o.destination} onChange={(e) => setDestination(e.target.value)} placeholder="Punta Cana, Marruecos…" autoComplete="off" />
            <datalist id={`odl-${k}`}>
              {destinations.map((d) => <option key={d.slug} value={d.name} />)}
            </datalist>
            {o.destinationId && <span className="t-small t-muted">Enlazada a la ficha del destino.</span>}
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
            <textarea id={`oin-${k}`} className="textarea" value={o.includes.join("\n")} onChange={(e) => field("includes", e.target.value.split("\n"))} />
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
