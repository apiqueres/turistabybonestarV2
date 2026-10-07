"use client";

import { useState } from "react";
import type { StoredRequest } from "@/types/admin";
import type { EmailBrand } from "@/lib/email-shell";
import { clientMessageEmail, defaultAdminMessage, openPreview, type AdminMessage } from "@/lib/email-templates";
import { ArrowRight } from "@/components/ui/icons";
import type { Mode } from "./sources";

interface Props {
  request: StoredRequest;
  brand: EmailBrand;
  mode: Mode;
  /** Envía el correo (servidor por SMTP, o el programa de correo en la demo) y devuelve un resumen. */
  send: (msg: AdminMessage) => Promise<string>;
}

/** Write to the client from their request: branded HTML e-mail with live preview. */
export function MessageComposer({ request, brand, mode, send }: Props) {
  const [msg, setMsg] = useState<AdminMessage>(() => defaultAdminMessage(request.data, brand));
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof AdminMessage>(k: K, v: AdminMessage[K]) => setMsg((m) => ({ ...m, [k]: v }));
  const email = clientMessageEmail(request.id, request.data, msg, brand);

  const doSend = async () => {
    setBusy(true);
    try {
      setState(await send(msg));
    } catch (err) {
      setState(err instanceof Error ? err.message : "No se pudo enviar el correo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card-pad flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="lbl mb-0">Mensaje al cliente</span>
        <span className="t-small t-muted">Para: {request.data.contacto.email}</span>
      </div>
      <div>
        <label className="lbl" htmlFor="m-subject">Asunto</label>
        <input id="m-subject" className="input" value={msg.subject} onChange={(e) => set("subject", e.target.value)} />
      </div>
      <div>
        <label className="lbl" htmlFor="m-body">Mensaje (una línea en blanco separa párrafos)</label>
        <textarea id="m-body" className="textarea" style={{ minHeight: 160 }} value={msg.message} onChange={(e) => set("message", e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="lbl" htmlFor="m-sig">Firma</label>
          <textarea id="m-sig" className="textarea" style={{ minHeight: 60 }} value={msg.signature} onChange={(e) => set("signature", e.target.value)} />
        </div>
        <label className="check self-end">
          <input type="checkbox" checked={msg.includeSummary} onChange={(e) => set("includeSummary", e.target.checked)} />
          <span>Adjuntar el resumen de su solicitud</span>
        </label>
      </div>
      <div className="card" style={{ background: "var(--bg-alt)" }}>
        <iframe title="Vista previa del correo" srcDoc={email.html} style={{ width: "100%", height: 420, border: 0, background: "#f4f7f8" }} />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <button type="button" className="btn btn-primary btn-sm" onClick={doSend} disabled={busy}>
          {mode === "db" ? "Enviar correo" : "Enviar (abre tu correo)"}
          <ArrowRight className="btn-icon" />
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openPreview(email)}>
          Abrir vista previa
        </button>
        {state && <span className="form-status">{state}</span>}
      </div>
    </div>
  );
}
