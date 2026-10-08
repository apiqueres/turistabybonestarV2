import type { ContactoInput, SolicitudInput } from "./validation";
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
    includeSummary: false,
  };
}

/** Reply written by the agency to a message from the short contact form, in the same template. */
export function contactReplyEmail(id: string, c: ContactoInput, msg: AdminMessage, brand: EmailBrand): RenderedEmail {
  const paragraphs = msg.message.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const spec: EmailSpec = {
    preheader: paragraphs[0]?.slice(0, 120) ?? msg.subject,
    kicker: `Sobre tu mensaje · Ref. ${id}`,
    title: msg.subject,
    blocks: [
      ...paragraphs.map((text) => ({ kind: "p" as const, text })),
      ...(msg.includeSummary ? [{ kind: "note" as const, title: "Tu mensaje", items: c.mensaje.split(/\n+/).map((l) => l.trim()).filter(Boolean) }] : []),
      { kind: "signature", lines: msg.signature.split("\n").map((l) => l.trim()).filter(Boolean) },
    ],
    brand,
    siteUrl: siteUrl(),
  };
  return { subject: msg.subject, html: renderEmailHtml(spec), text: renderEmailText(spec) };
}

/** Default draft when replying to a contact message. */
export function defaultContactReply(c: ContactoInput, brand: EmailBrand): AdminMessage {
  return {
    subject: `Respuesta a tu mensaje · ${brand.name}`,
    message: `Hola, ${firstName(c.nombre)}.\n\nGracias por escribirnos. Hemos leído tu mensaje y te contestamos a continuación.\n\n`,
    signature: `Un saludo,\nEl equipo de ${brand.name}`,
    includeSummary: false,
  };
}

/** Opens the rendered HTML in a new tab (demo preview). */
export function openPreview(email: RenderedEmail) {
  const url = URL.createObjectURL(new Blob([email.html], { type: "text/html;charset=utf-8" }));
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ---------- Avisos a la agencia (se envían desde el servidor) ---------- */

/** Nueva solicitud del asistente: resumen en HTML y el brief completo en el texto plano. */
export function agencyRequestEmail(id: string, createdAt: string, s: SolicitudInput, prompt: string, brand: EmailBrand): RenderedEmail {
  const destinos = s.destinos.map((d) => d.nombre).join(", ");
  const spec: EmailSpec = {
    preheader: `${s.contacto.nombre} quiere ir a ${destinos}.`,
    kicker: `Nueva solicitud · Ref. ${id}`,
    title: `${s.contacto.nombre} · ${destinos}`,
    blocks: [
      {
        kind: "rows",
        title: "Cliente",
        rows: [
          ["Nombre", s.contacto.nombre],
          ["Correo", s.contacto.email],
          ["Teléfono", s.contacto.telefono || "No indicado"],
          ["Recibida", createdAt],
        ],
      },
      ...requestBlocks(s),
      { kind: "p", text: "El brief completo va en la versión de texto de este correo y en el panel de administración." },
    ],
    brand,
    siteUrl: siteUrl(),
  };
  return { subject: `Solicitud de viaje · ${destinos} · ${s.contacto.nombre}`, html: renderEmailHtml(spec), text: prompt };
}

/** Mensaje del formulario corto de contacto. */
export function agencyContactEmail(id: string, c: { nombre: string; email: string; telefono?: string; mensaje: string }, brand: EmailBrand): RenderedEmail {
  const spec: EmailSpec = {
    preheader: c.mensaje.slice(0, 120),
    kicker: `Contacto web · Ref. ${id}`,
    title: `${c.nombre} ha escrito desde la web`,
    blocks: [
      { kind: "p", text: c.mensaje },
      {
        kind: "rows",
        title: "Datos",
        rows: [
          ["Nombre", c.nombre],
          ["Correo", c.email],
          ["Teléfono", c.telefono || "No indicado"],
        ],
      },
    ],
    brand,
    siteUrl: siteUrl(),
  };
  return { subject: `Contacto web · ${c.nombre}`, html: renderEmailHtml(spec), text: renderEmailText(spec) };
}
