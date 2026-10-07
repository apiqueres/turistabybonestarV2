import type { SolicitudInput } from "./validation";
import { summarize } from "./prompt";
import { renderEmailHtml, renderEmailText, type EmailBlock, type EmailBrand, type EmailSpec } from "./email-shell";
import { BASE_PATH } from "./config";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin + BASE_PATH : "https://turistabybonestar.com");

const firstName = (full: string) => full.trim().split(/\s+/)[0] || "viajero";

function requestBlocks(s: SolicitudInput): EmailBlock[] {
  return [
    { kind: "chips", title: "Destinos", items: s.destinos.map((d) => d.nombre) },
    ...summarize(s).map((sec) => ({ kind: "rows" as const, title: sec.title, rows: sec.rows })),
  ];
}

/** Sent to the client right after the wizard: what they told us and what happens next. */
export function clientConfirmationEmail(id: string, s: SolicitudInput, brand: EmailBrand): RenderedEmail {
  const destinos = s.destinos.map((d) => d.nombre).join(", ");
  const spec: EmailSpec = {
    preheader: `Tu solicitud de viaje a ${destinos} ya está con nosotros.`,
    kicker: `Solicitud recibida · Ref. ${id}`,
    title: `Hola, ${firstName(s.contacto.nombre)}. Ya tenemos tu viaje a ${destinos}.`,
    blocks: [
      {
        kind: "p",
        text: `Gracias por contarnos cómo viajas. Esto es lo que hemos recogido; si falta algo o cambias de idea, responde a este correo y lo ajustamos antes de empezar.`,
      },
      ...requestBlocks(s),
      {
        kind: "note",
        title: "Qué pasa ahora",
        items: [
          "Un gestor revisa tus respuestas y diseña una primera propuesta: ruta, alojamientos, traslados y mesa.",
          "Te llamamos o te escribimos en 48 horas laborables.",
          "La apruebas o la corriges las veces que haga falta. Solo entonces reservamos.",
        ],
      },
      { kind: "signature", lines: ["Un saludo,", `El equipo de ${brand.name}`] },
    ],
    brand,
    siteUrl: siteUrl(),
  };
  return { subject: `Tu viaje a ${destinos} · hemos recibido tu solicitud`, html: renderEmailHtml(spec), text: renderEmailText(spec) };
}

export interface AdminMessage {
  subject: string;
  message: string;
  signature: string;
  includeSummary: boolean;
}

/** Free-form message written by the agency from the admin panel, in the same template. */
export function clientMessageEmail(id: string, s: SolicitudInput, msg: AdminMessage, brand: EmailBrand): RenderedEmail {
  const destinos = s.destinos.map((d) => d.nombre).join(", ");
  const paragraphs = msg.message.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const spec: EmailSpec = {
    preheader: paragraphs[0]?.slice(0, 120) ?? msg.subject,
    kicker: `Sobre tu viaje a ${destinos} · Ref. ${id}`,
    title: msg.subject,
    blocks: [
      ...paragraphs.map((text) => ({ kind: "p" as const, text })),
      ...(msg.includeSummary ? [{ kind: "p" as const, text: "Para que lo tengas a mano, esto es lo que nos contaste:" }, ...requestBlocks(s)] : []),
      { kind: "signature", lines: msg.signature.split("\n").map((l) => l.trim()).filter(Boolean) },
    ],
    brand,
    siteUrl: siteUrl(),
  };
  return { subject: msg.subject, html: renderEmailHtml(spec), text: renderEmailText(spec) };
}

/** Default draft offered to the agency when opening the composer. */
export function defaultAdminMessage(s: SolicitudInput, brand: EmailBrand): AdminMessage {
  const destinos = s.destinos.map((d) => d.nombre).join(", ");
  return {
    subject: `Tu propuesta para ${destinos}`,
    message: `Hola, ${firstName(s.contacto.nombre)}.\n\nHemos revisado lo que nos contaste y ya estamos trabajando en una primera propuesta para ${destinos}. Antes de cerrarla nos gustaría confirmar contigo un par de detalles.\n\n¿Te viene bien que te llamemos esta semana? Dinos qué día y franja te encaja.`,
    signature: `Un saludo,\nEl equipo de ${brand.name}`,
    includeSummary: true,
  };
}

/** Opens the rendered HTML in a new tab (demo preview). */
export function openPreview(email: RenderedEmail) {
  const url = URL.createObjectURL(new Blob([email.html], { type: "text/html;charset=utf-8" }));
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
