"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Close } from "@/components/ui/icons";

export interface RatioOption {
  label: string;
  /** ancho / alto; null = la proporción original de la foto. */
  value: number | null;
}

interface Props {
  file: File;
  /** Proporciones ofrecidas; la primera es la inicial. Con una sola, el marco es fijo. */
  ratios: RatioOption[];
  /** Sube el recorte y devuelve la URL con la que mostrar la imagen final. */
  upload: (file: File) => Promise<string>;
  onClose: () => void;
}

/** Lado mayor del recorte que se envía (el servidor lo reduce a 1600 px de todas formas). */
const MAX_OUT = 1600;
const MAX_ZOOM = 4;

interface Loaded {
  url: string;
  width: number;
  height: number;
}

/**
 * Diálogo de recorte al elegir una foto: la imagen se arrastra y se amplía dentro de un marco con la
 * proporción de la web; «Subir» genera el recorte en el navegador, lo sube y muestra la imagen final.
 */
export function ImageCropDialog({ file, ratios, upload, onClose }: Props) {
  const [img, setImg] = useState<Loaded | null>(null);
  const [ratioIdx, setRatioIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  // null = centrada (al cargar la foto o cambiar de proporción); después, lo que arrastre el usuario.
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<{ kind: "crop" } | { kind: "uploading" } | { kind: "done"; src: string } | { kind: "error"; text: string }>({ kind: "crop" });
  const [frameW, setFrameW] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // La foto elegida, con sus medidas naturales.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg({ url, width: im.naturalWidth, height: im.naturalHeight });
      setZoom(1);
      setOffset(null);
    };
    im.onerror = () => setPhase({ kind: "error", text: "No se pudo leer la imagen." });
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Ancho real del marco (responsive).
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ratio = ratios[ratioIdx]?.value ?? null;
  const aspect = ratio ?? (img ? img.width / img.height : 4 / 3);
  const frameH = frameW / aspect;
  // Escala mínima: la foto cubre el marco entero; el zoom amplía a partir de ahí.
  const base = img && frameW ? Math.max(frameW / img.width, frameH / img.height) : 1;
  const scale = base * zoom;
  const drawnW = (img?.width ?? 0) * scale;
  const drawnH = (img?.height ?? 0) * scale;

  // El desplazamiento nunca deja ver el fondo: la foto siempre tapa el marco.
  const clamp = useCallback(
    (o: { x: number; y: number }, dw = drawnW, dh = drawnH) => ({
      x: Math.min(0, Math.max(frameW - dw, o.x)),
      y: Math.min(0, Math.max(frameH - dh, o.y)),
    }),
    [drawnW, drawnH, frameW, frameH],
  );

  const pos = clamp(offset ?? { x: (frameW - drawnW) / 2, y: (frameH - drawnH) / 2 });
  const pickRatio = (i: number) => {
    setRatioIdx(i);
    setZoom(1);
    setOffset(null);
  };

  const setZoomKeepingCenter = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    const s2 = base * next;
    const cx = (frameW / 2 - pos.x) / scale; // punto de la foto que está en el centro del marco
    const cy = (frameH / 2 - pos.y) / scale;
    setZoom(next);
    setOffset(clamp({ x: frameW / 2 - cx * s2, y: frameH / 2 - cy * s2 }, (img?.width ?? 0) * s2, (img?.height ?? 0) * s2));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset(clamp({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomKeepingCenter(zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  };

  const outName = useMemo(() => file.name.replace(/\.[^.]+$/, "") || "imagen", [file.name]);

  const submit = async () => {
    const im = imgRef.current;
    if (!im || !img) return;
    setPhase({ kind: "uploading" });
    try {
      // Región visible del marco, en píxeles de la foto original.
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const sw = frameW / scale;
      const sh = frameH / scale;
      const k = Math.min(1, MAX_OUT / Math.max(sw, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sw * k));
      canvas.height = Math.max(1, Math.round(sh * k));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("El navegador no permite recortar la imagen.");
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const png = file.type === "image/png";
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, png ? "image/png" : "image/jpeg", 0.92));
      if (!blob) throw new Error("No se pudo generar el recorte.");
      const out = new File([blob], `${outName}.${png ? "png" : "jpg"}`, { type: blob.type });
      const src = await upload(out);
      setPhase({ kind: "done", src });
    } catch (err) {
      setPhase({ kind: "error", text: err instanceof Error ? err.message : "No se pudo subir la imagen." });
    }
  };

  const busy = phase.kind === "uploading";

  return (
    <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Ajustar la imagen" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="crop-dialog">
        <div className="flex items-center justify-between gap-4">
          <span className="lbl mb-0">{phase.kind === "done" ? "Imagen subida" : "Ajusta la imagen"}</span>
          <button type="button" className="crop-close" aria-label="Cerrar" onClick={onClose} disabled={busy}>
            <Close width={18} height={18} />
          </button>
        </div>

        {phase.kind === "done" ? (
          <>
            <div className="crop-frame" style={{ aspectRatio: String(aspect) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={phase.src} alt="" className="crop-final" />
            </div>
            <p className="t-small t-muted">Así se verá en la web. Recuerda guardar la ficha para conservar el cambio.</p>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
                Listo <ArrowRight className="btn-icon" />
              </button>
            </div>
          </>
        ) : (
          <>
            {ratios.length > 1 && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Proporción">
                {ratios.map((r, i) => (
                  <button key={r.label} type="button" role="radio" aria-checked={i === ratioIdx} className={`chip ${i === ratioIdx ? "is-on" : ""}`} onClick={() => pickRatio(i)} disabled={busy}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            <div
              ref={frameRef}
              className={`crop-frame ${busy ? "is-busy" : ""}`}
              style={{ aspectRatio: String(aspect) }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={img.url}
                  alt=""
                  draggable={false}
                  style={{ width: drawnW, height: drawnH, transform: `translate(${pos.x}px, ${pos.y}px)` }}
                />
              )}
              {!img && phase.kind !== "error" && <span className="t-small t-muted crop-hint">Cargando…</span>}
            </div>
            <label className="crop-zoom">
              <span className="lbl mb-0">Zoom</span>
              <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => setZoomKeepingCenter(Number(e.target.value))} disabled={!img || busy} />
            </label>
            <p className="t-small t-muted">Arrastra la foto para encuadrarla. Se guardará solo lo que se ve dentro del marco.</p>
            {phase.kind === "error" && <span className="form-status">{phase.text}</span>}
            <div className="flex flex-wrap gap-3 justify-end">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={busy}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={!img || busy}>
                {busy ? "Subiendo…" : "Subir"} <ArrowRight className="btn-icon" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Proporciones de las imágenes de la web: fichas de destinos y ofertas a 4:3, equipo a 4:5, cabeceras panorámicas. */
export const CARD_RATIO: RatioOption[] = [{ label: "4:3 (ficha)", value: 4 / 3 }];
export const BLOCK_RATIOS: RatioOption[] = [
  { label: "4:3", value: 4 / 3 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
  { label: "Libre (original)", value: null },
];
