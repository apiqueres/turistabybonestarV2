"use client";

import { useRef, useState } from "react";
import { openPreview, type AdminMessage, type RenderedEmail } from "@/lib/email-templates";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_FILES, ATTACHMENT_MAX_TOTAL, attachmentsProblem, formatBytes } from "@/lib/attachments";
import { ArrowRight, Close } from "@/components/ui/icons";
import type { Mode } from "./sources";

interface Props {
  /** Dirección del destinatario (solo informativa). */
  to: string;
  /** Borrador inicial. */
  initial: AdminMessage;
  /** Renderiza el correo con la plantilla que toque (solicitud o contacto). */
  render: (msg: AdminMessage) => RenderedEmail;
  /** Texto de la casilla de "adjuntar": resumen de la solicitud o mensaje original. */
  summaryLabel?: string;
  mode: Mode;
  /** Envía el correo (servidor por SMTP, o el programa de correo en la demo) y devuelve un resumen. */
  send: (msg: AdminMessage, files: File[]) => Promise<string>;
}

/** Write to a client (from a request or a contact message): branded HTML e-mail with live preview. */
export function MessageComposer({ to, initial, render, summaryLabel = "Adjuntar el resumen de su solicitud", mode, send }: Props) {
  const [msg, setMsg] = useState<AdminMessage>(initial);
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const picker = useRef<HTMLInputElement>(null);
  const set = <K extends keyof AdminMessage>(k: K, v: AdminMessage[K]) => setMsg((m) => ({ ...m, [k]: v }));
  // Los nombres van en el borrador para que la vista previa y el correo los listen.
  const draft: AdminMessage = { ...msg, attachments: files.length ? files.map((f) => f.name) : undefined };
  const email = render(draft);
  const canAttach = mode === "db"; // en la demo el correo se abre en el programa del usuario: sin adjuntos

  const addFiles = (picked: FileList | null) => {
    if (!picked?.length) return;
    const next = [...files];
    for (const f of Array.from(picked)) if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    const problem = attachmentsProblem(next);
    if (problem) setState(problem);
    else {
      setFiles(next);
      setState(null);
    }
    if (picker.current) picker.current.value = "";
  };
  const removeFile = (i: number) => setFiles((fs) => fs.filter((_, k) => k !== i));

  const doSend = async () => {
    setBusy(true);
    try {
      setState(await send(draft, files));
      setFiles([]);
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
        <span className="t-small t-muted">Para: {to}</span>
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
          <span>{summaryLabel}</span>
        </label>
      </div>
      {canAttach && (
        <div>
          <label className="lbl" htmlFor="m-files">
            Adjuntos (PDF, JPG, PNG o WebP · hasta {ATTACHMENT_MAX_FILES} archivos y {formatBytes(ATTACHMENT_MAX_TOTAL)} en total)
          </label>
          <input id="m-files" ref={picker} type="file" multiple accept={ATTACHMENT_ACCEPT} className="t-small" onChange={(e) => addFiles(e.target.files)} />
          {files.length > 0 && (
            <ul className="attach-list">
              {files.map((f, i) => (
                <li key={`${f.name}-${f.size}`}>
                  <span className="attach-name">{f.name}</span>
                  <span className="t-muted">{formatBytes(f.size)}</span>
                  <button type="button" className="attach-remove" aria-label={`Quitar ${f.name}`} onClick={() => removeFile(i)}>
                    <Close width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
