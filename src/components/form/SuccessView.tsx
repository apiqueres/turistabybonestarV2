"use client";

import Link from "next/link";
import type { FormContent } from "@/types/form";
import { ArrowRight } from "@/components/ui/icons";
import { Brand } from "@/components/layout/Brand";
import { useState } from "react";
import { sendDemoMail } from "@/lib/email";

interface Props {
  content: FormContent["success"];
  id: string;
  brand: string;
  /** The generated brief, offered as a .txt download and as an e-mail. */
  prompt?: string;
  agencyEmail: string;
  demo?: boolean;
}

export function SuccessView({ content, id, brand, prompt, agencyEmail, demo }: Props) {
  const [mailMsg, setMailMsg] = useState<string | null>(null);
  const mail = async () => {
    if (!prompt) return;
    try {
      const how = await sendDemoMail({ to: agencyEmail, subject: `Solicitud de viaje · ${id}`, text: prompt, fromName: "Web TuristaByBonestar" });
      setMailMsg(how === "sent" ? "Correo enviado a la agencia." : "Se ha abierto tu programa de correo con la solicitud.");
    } catch {
      setMailMsg("No se pudo enviar el correo.");
    }
  };
  const download = () => {
    if (!prompt) return;
    const url = URL.createObjectURL(new Blob([prompt], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="wiz">
      <header className="wiz-header">
        <div title={brand}>
          <Brand />
        </div>
        <Link href="/" className="t-muted hover:text-white transition-colors">
          {content.home.label}
        </Link>
      </header>
      <div className="wiz-body wiz-step flex flex-col justify-center">
        <div className="max-w-[60ch]">
          <div className="kicker">{content.kicker}</div>
          <h1 className="t-h2 mt-5">
            {content.title[0]}
            <br />
            {content.title[1]}
          </h1>
          <p className="t-body mt-6">{content.text}</p>
          <div className="rule mt-8 pt-6 flex flex-col gap-1">
            <span className="kicker">{content.reference}</span>
            <span className="t-small break-all">{id}</span>
          </div>
          {demo && (
            <p className="t-small t-muted mt-4">
              Versión de demostración: la solicitud no se ha enviado a ningún servidor. Puedes descargar el brief generado o enviarlo por correo.
            </p>
          )}
          {mailMsg && <p className="form-status mt-4">{mailMsg}</p>}
          <div className="mt-10 flex flex-wrap gap-4">
            {prompt && (
              <button type="button" onClick={download} className="btn btn-primary btn-sm">
                Descargar brief (.txt)
                <ArrowRight className="btn-icon" />
              </button>
            )}
            {prompt && (
              <button type="button" onClick={mail} className="btn btn-secondary btn-sm">
                Enviar por correo
                <ArrowRight className="btn-icon" />
              </button>
            )}
            <Link href={content.home.href} className="btn btn-primary btn-sm">
              {content.home.label}
              <ArrowRight className="btn-icon" />
            </Link>
            <Link href={content.map.href} className="btn btn-secondary btn-sm">
              {content.map.label}
              <ArrowRight className="btn-icon" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
