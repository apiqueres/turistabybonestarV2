"use client";

import { useState } from "react";
import type { SiteContent } from "@/types/content";
import { contactoSchema } from "@/lib/validation";
import { STATIC_DEMO } from "@/lib/config";
import { readJSON, writeJSON } from "@/lib/storage";
import { mailtoLink } from "@/lib/mailto";
import { ArrowRight } from "@/components/ui/icons";

interface Props {
  content: SiteContent["contact"];
  agencyEmail: string;
}

type Fields = { nombre: string; email: string; telefono: string; mensaje: string; privacidad: boolean };
const empty: Fields = { nombre: "", email: "", telefono: "", mensaje: "", privacidad: false };

export function ContactForm({ content, agencyEmail }: Props) {
  const [f, setF] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const update = (k: keyof Fields, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactoSchema.safeParse(f);
    if (!parsed.success) {
      const next: Partial<Record<keyof Fields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      if (STATIC_DEMO) {
        const list = readJSON<unknown[]>("tb:demo-contacto", []);
        writeJSON("tb:demo-contacto", [...list, { createdAt: new Date().toISOString(), data: parsed.data }]);
        await new Promise((r) => window.setTimeout(r, 600));
        setStatus("done");
        return;
      }
      const res = await fetch("/api/contacto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = (await res.json()) as { ok: boolean };
      if (!res.ok || !json.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="form-card">
        <div className="kicker">{content.formKicker}</div>
        <h2 className="t-h2 mt-6">{content.success.title}</h2>
        <p className="t-body mt-4">{content.success.text}</p>
        <a
          href={mailtoLink({ to: agencyEmail, subject: `Contacto web · ${f.nombre}`, text: `${f.mensaje}

${f.nombre}
${f.email}
${f.telefono}` })}
          className="btn btn-secondary btn-sm mt-6"
        >
          Enviar también por correo
          <ArrowRight className="btn-icon" />
        </a>
      </div>
    );
  }

  const fields = content.fields;
  return (
    <form className="form-card flex flex-col gap-8" onSubmit={submit} noValidate>
      <div className="flex justify-between kicker">
        <span>{fields ? content.formKicker : ""}</span>
        <span>4 campos</span>
      </div>
      <div className="field">
        <label htmlFor="c-nombre">{fields.name}</label>
        <input id="c-nombre" autoComplete="name" placeholder="Escribe aquí" value={f.nombre} onChange={(e) => update("nombre", e.target.value)} />
        {errors.nombre && <span className="field-error">{errors.nombre}</span>}
      </div>
      <div className="field">
        <label htmlFor="c-email">{fields.email}</label>
        <input id="c-email" type="email" autoComplete="email" placeholder="Escribe aquí" value={f.email} onChange={(e) => update("email", e.target.value)} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="c-tel">{fields.phone}</label>
        <input id="c-tel" type="tel" autoComplete="tel" placeholder="Escribe aquí" value={f.telefono} onChange={(e) => update("telefono", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="c-msg">{fields.message}</label>
        <textarea id="c-msg" placeholder={fields.messagePlaceholder} value={f.mensaje} onChange={(e) => update("mensaje", e.target.value)} />
        {errors.mensaje && <span className="field-error">{errors.mensaje}</span>}
      </div>
      <div>
        <label className="check">
          <input type="checkbox" checked={f.privacidad} onChange={(e) => update("privacidad", e.target.checked)} />
          <span>{fields.privacy}</span>
        </label>
        {errors.privacidad && <div className="field-error text-[13px] text-accent mt-2">{errors.privacidad}</div>}
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <button type="submit" className="btn btn-primary btn-sm" disabled={status === "sending"}>
          {fields.submit}
          <ArrowRight className="btn-icon" />
        </button>
        {status === "error" && <span className="form-status">No se pudo enviar. Inténtalo de nuevo.</span>}
      </div>
    </form>
  );
}
