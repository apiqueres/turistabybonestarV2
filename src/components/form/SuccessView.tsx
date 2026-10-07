"use client";

import Link from "next/link";
import type { FormContent } from "@/types/form";
import { ArrowRight } from "@/components/ui/icons";
import { Brand } from "@/components/layout/Brand";
import { openMailto } from "@/lib/mailto";
import type { EmailBrand } from "@/lib/email-shell";

interface Props {
  content: FormContent["success"];
  id: string;
  brand: EmailBrand;
  /** El brief generado; en la demo estática se ofrece enviarlo por correo. */
  prompt?: string;
  demo?: boolean;
}

export function SuccessView({ content, id, brand, prompt, demo }: Props) {
  // Demo estática: no hay servidor, así que el brief se manda desde el programa de correo del visitante.
  const mail = () => {
    if (prompt) openMailto({ to: brand.email, subject: `Solicitud de viaje · ${id}`, text: prompt });
  };
  return (
    <div className="wiz">
      <header className="wiz-header">
        <div title={brand.name}>
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
              Versión de demostración: la solicitud no se ha enviado a ningún servidor. Puedes enviar el brief generado por correo.
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            {demo && prompt && (
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
