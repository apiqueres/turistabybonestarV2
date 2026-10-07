"use client";

import { useState } from "react";
import { Close, ArrowRight } from "@/components/ui/icons";
import { uploadImage } from "@/lib/admin/image";
import { asset } from "@/lib/config";

/**
 * Editor genérico de un bloque de texto de la web (JSON con la forma de src/data/site.ts):
 * cadenas, números, casillas, listas y objetos anidados, sin cambiar la estructura.
 */
const LABELS: Record<string, string> = {
  kicker: "Etiqueta", title: "Título", text: "Texto", label: "Texto del enlace", href: "Enlace (ruta)", subtitle: "Subtítulo", word: "Palabra",
  primary: "Botón principal", secondary: "Botón secundario", video: "Vídeo", mp4: "Vídeo (mp4)", poster: "Imagen de portada",
  steps: "Pasos", number: "Número", link: "Enlace", meta: "Línea pequeña", image: "Imagen", src: "Ruta de la imagen", alt: "Texto alternativo",
  paragraph: "Párrafo", stats: "Cifras", value: "Valor", suffix: "Sufijo", partners: "Colaboradores", items: "Elementos", step: "Paso del asistente",
  statement: "Afirmación", answer: "Respuesta", quote: "Cita", author: "Autor", members: "Miembros", name: "Nombre", role: "Cargo", bio: "Biografía",
  id: "Id", rule: "Regla", hint: "Pista", search: "Buscador", placeholder: "Texto de ejemplo", legend: "Leyenda", list: "Tu lista", empty: "Cuando está vacío",
  cta: "Botón", ctaHref: "Enlace del botón", needOne: "Aviso sin destino", recurrent: "Destinos recurrentes", add: "Añadir", remove: "Quitar",
  formKicker: "Etiqueta del formulario", fields: "Campos", email: "Correo", phone: "Teléfono", message: "Mensaje", messagePlaceholder: "Ejemplo del mensaje",
  privacy: "Privacidad", submit: "Botón de envío", success: "Mensaje de éxito", mapNudge: "Aviso del mapa", community: "Comunidad", sections: "Secciones",
  contact: "Contacto", legal: "Legal", legalLinks: "Enlaces legales", credits: "Créditos", tagline: "Lema", city: "Dirección", whatsapp: "WhatsApp",
  communityName: "Nombre de la comunidad", communityUrl: "Enlace de la comunidad", hours: "Horario", instagram: "Instagram", year: "Año", links: "Enlaces",
  key: "Clave de ruta", accent: "Destacado (dorado)",
};
const label = (k: string) => LABELS[k] ?? k;

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

interface NodeProps {
  value: Json;
  onChange: (v: Json) => void;
  name: string;
  path: string;
}

const IMAGE_KEYS = new Set(["src", "poster"]);

/** Campo de imagen: ruta editable + subida al servidor + miniatura. */
function ImageField({ id, name, value, onChange }: { id: string; name: string; value: string; onChange: (v: string) => void }) {
  const [state, setState] = useState<string | null>(null);
  const upload = async (file?: File) => {
    if (!file) return;
    setState("Subiendo…");
    try {
      onChange((await uploadImage(file)).path);
      setState(null);
    } catch (err) {
      setState(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    }
  };
  return (
    <div className="md:col-span-2 flex gap-4 items-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {value && /\.(webp|jpe?g|png|gif|avif)$/i.test(value) ? <img src={asset(value)} alt="" style={{ width: 64, height: 64, objectFit: "cover" }} /> : <div style={{ width: 64, height: 64, background: "var(--bg-alt)" }} />}
      <div className="flex-1 flex flex-col gap-2">
        <label className="lbl" htmlFor={id}>{label(name)}</label>
        <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="file" accept="image/*" className="t-small" aria-label="Subir imagen" onChange={(e) => upload(e.target.files?.[0])} />
        {state && <span className="t-small t-muted">{state}</span>}
      </div>
    </div>
  );
}

function Node({ value, onChange, name, path }: NodeProps) {
  const id = `blk-${path.replace(/[^a-z0-9]+/gi, "-")}`;
  if (typeof value === "string" && IMAGE_KEYS.has(name)) return <ImageField id={id} name={name} value={value} onChange={onChange} />;
  if (typeof value === "string") {
    const long = value.length > 70 || value.includes("\n");
    return (
      <div className={long ? "md:col-span-2" : ""}>
        <label className="lbl" htmlFor={id}>{label(name)}</label>
        {long ? <textarea id={id} className="textarea" value={value} onChange={(e) => onChange(e.target.value)} /> : <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />}
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <div>
        <label className="lbl" htmlFor={id}>{label(name)}</label>
        <input id={id} className="input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="check self-end">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span>{label(name)}</span>
      </label>
    );
  }
  if (value === null) return null;
  if (Array.isArray(value)) {
    const strings = value.every((v) => typeof v === "string");
    const set = (i: number, v: Json) => onChange(value.map((x, n) => (n === i ? v : x)));
    const remove = (i: number) => onChange(value.filter((_, n) => n !== i));
    const add = () => onChange([...value, strings ? "" : JSON.parse(JSON.stringify(value[value.length - 1] ?? {}))]);
    return (
      <div className="md:col-span-2 flex flex-col gap-2">
        <span className="lbl">{label(name)}</span>
        {value.map((v, i) =>
          strings ? (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input className="input" value={v as string} aria-label={`${label(name)} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
              <button type="button" aria-label="Quitar" onClick={() => remove(i)}><Close width={18} height={18} /></button>
            </div>
          ) : (
            <div key={i} className="card card-pad flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="badge">{label(name)} {i + 1}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => remove(i)}>Quitar</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Node value={v} onChange={(nv) => set(i, nv)} name={name} path={`${path}.${i}`} />
              </div>
            </div>
          ),
        )}
        <button type="button" className="btn btn-secondary btn-sm self-start" onClick={add}>
          Añadir<ArrowRight className="btn-icon" />
        </button>
      </div>
    );
  }
  // objeto
  const entries = Object.entries(value);
  const inner = entries.map(([k, v]) => (
    <Node key={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} name={k} path={`${path}.${k}`} />
  ));
  if (!path.includes(".")) return <>{inner}</>; // raíz: los campos van directos a la rejilla
  return (
    <fieldset className="md:col-span-2 flex flex-col gap-3 rule pt-4">
      <legend className="lbl">{label(name)}</legend>
      <div className="grid md:grid-cols-2 gap-4">{inner}</div>
    </fieldset>
  );
}

export function BlockEditor({ value, onChange, blockKey }: { value: Json; onChange: (v: Json) => void; blockKey: string }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Node value={value} onChange={onChange} name={blockKey} path={blockKey} />
    </div>
  );
}
