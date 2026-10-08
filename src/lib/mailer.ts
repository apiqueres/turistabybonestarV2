import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { EmailBrand } from "./email-shell";
import type { ContactoInput, SolicitudInput } from "./validation";
import { agencyContactEmail, agencyRequestEmail, clientConfirmationEmail, clientMessageEmail, contactReplyEmail, type AdminMessage, type RenderedEmail } from "./email-templates";
import { logMessage } from "./repo/solicitudes";

/**
 * Envío de correo desde el servidor por SMTP (Brevo, Resend, Gmail con contraseña de aplicación…).
 * Variables: SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("1" para 465), SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_AGENCY.
 * Sin SMTP_HOST no se envía nada: se registra como "skipped" para que la web siga funcionando.
 */
export type MailStatus = "sent" | "error" | "skipped";

const g = globalThis as unknown as { __tbbMailer?: Transporter | null };

export const mailConfigured = () => Boolean(process.env.SMTP_HOST);
export const agencyAddress = () => process.env.MAIL_AGENCY ?? "";
const fromAddress = () => process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "no-reply@localhost";

function transport(): Transporter | null {
  if (g.__tbbMailer !== undefined) return g.__tbbMailer;
  if (!mailConfigured()) return (g.__tbbMailer = null);
  const port = Number(process.env.SMTP_PORT ?? 587);
  g.__tbbMailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "1" || port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  return g.__tbbMailer;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

/** Envía un correo y devuelve el resultado sin lanzar (el error queda en `error`). */
export async function sendMail(mail: OutgoingMail): Promise<{ status: MailStatus; error?: string }> {
  const t = transport();
  if (!t) {
    console.warn(`[mailer] SMTP no configurado; no se envía «${mail.subject}» a ${mail.to}`);
    return { status: "skipped" };
  }
  try {
    await t.sendMail({ from: fromAddress(), to: mail.to, subject: mail.subject, html: mail.html, text: mail.text, replyTo: mail.replyTo });
    return { status: "sent" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[mailer] error enviando «${mail.subject}» a ${mail.to}:`, error);
    return { status: "error", error };
  }
}

/** Envía y deja traza en MessageLog (ligada a la solicitud si se indica). */
async function sendAndLog(kind: string, mail: OutgoingMail, solicitudId?: string): Promise<MailStatus> {
  const res = await sendMail(mail);
  try {
    await logMessage({ solicitudId, to: mail.to, subject: mail.subject, kind, status: res.status, error: res.error });
  } catch (err) {
    console.error("[mailer] no se pudo registrar el envío", err);
  }
  return res.status;
}

const rendered = (e: RenderedEmail, to: string, replyTo?: string): OutgoingMail => ({ to, subject: e.subject, html: e.html, text: e.text, replyTo });

/** Confirmación al cliente justo después del asistente. */
export function sendClientConfirmation(id: string, data: SolicitudInput, brand: EmailBrand) {
  return sendAndLog("confirmacion", rendered(clientConfirmationEmail(id, data, brand), data.contacto.email, brand.email), id);
}

/** Aviso a la agencia con el brief de una solicitud nueva. */
export function notifyAgencyRequest(id: string, createdAt: string, data: SolicitudInput, prompt: string, brand: EmailBrand) {
  const to = agencyAddress() || brand.email;
  return sendAndLog("aviso-agencia", rendered(agencyRequestEmail(id, createdAt, data, prompt, brand), to, data.contacto.email), id);
}

/** Aviso a la agencia de un mensaje del formulario corto. */
export function notifyAgencyContact(id: string, data: ContactoInput, brand: EmailBrand) {
  const to = agencyAddress() || brand.email;
  return sendAndLog("aviso-agencia", rendered(agencyContactEmail(id, data, brand), to, data.email));
}

/** Mensaje libre del gestor al cliente, desde el panel. */
export function sendClientMessage(id: string, data: SolicitudInput, msg: AdminMessage, brand: EmailBrand) {
  return sendAndLog("admin", rendered(clientMessageEmail(id, data, msg, brand), data.contacto.email, brand.email), id);
}

/** Respuesta desde el panel a un mensaje del formulario de contacto (sin solicitud asociada en el registro). */
export function sendContactReply(id: string, data: ContactoInput, msg: AdminMessage, brand: EmailBrand) {
  return sendAndLog("admin", rendered(contactReplyEmail(id, data, msg, brand), data.email, brand.email));
}
