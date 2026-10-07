"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/api";
import { ArrowRight } from "@/components/ui/icons";
import { BlockEditor, type Json } from "./BlockEditor";

export interface TextBlock {
  key: string;
  label: string;
  data: Json;
  updatedAt?: string;
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "Sin cambios");
const countFields = (v: Json): number => (typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? 1 : v === null ? 0 : Array.isArray(v) ? v.reduce((n: number, x) => n + countFields(x), 0) : Object.values(v).reduce((n: number, x) => n + countFields(x), 0));

/** Bloques de texto de la web; cada fila abre su editor en línea y se guarda con el botón. */
export function TextsAdmin({ blocks }: { blocks: TextBlock[] }) {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Json | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (b: TextBlock) => {
    if (openKey === b.key) {
      setOpenKey(null);
      setDraft(null);
      return;
    }
    setOpenKey(b.key);
    setDraft(JSON.parse(JSON.stringify(b.data)) as Json);
    setMsg(null);
  };
  const save = async (b: TextBlock) => {
    setBusy(true);
    try {
      await api(`/api/admin/textos/${encodeURIComponent(b.key)}`, { method: "PUT", body: draft });
      router.refresh();
      setMsg(`«${b.label}» guardado. La web ya muestra el cambio.`);
      setOpenKey(null);
      setDraft(null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Textos</h1>
        </div>
        <div className="flex gap-3 items-center">{msg && <span className="form-status">{msg}</span>}</div>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Bloque</th><th>Campos</th><th>Último cambio</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => {
              const isOpen = b.key === openKey;
              return (
                <Fragment key={b.key}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => open(b)} aria-expanded={isOpen}>
                    <td>
                      <div>{b.label}</div>
                      <div className="t-muted">{b.key}</div>
                    </td>
                    <td>{countFields(b.data)}</td>
                    <td className="whitespace-nowrap">{fmtDate(b.updatedAt)}</td>
                  </tr>
                  {isOpen && draft !== null && (
                    <tr className="detail-row">
                      <td colSpan={3}>
                        <div className="detail" style={{ gridTemplateColumns: "1fr" }}>
                          <BlockEditor value={draft} onChange={setDraft} blockKey={b.key} />
                          <div className="flex flex-wrap gap-3 items-center rule pt-4">
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => save(b)} disabled={busy}>
                              Guardar
                              <ArrowRight className="btn-icon" />
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => open(b)}>Cancelar</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
