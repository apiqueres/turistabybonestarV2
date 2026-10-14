import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { EmailBrand } from "./email-shell";
import type { ContactoInput, SolicitudInput } from "./validation";
import {
  agencyContactEmail,
  agencyRequestEmail,
  clientConfirmationEmail,
  clientMessageEmail,
  contactReplyEmail,
  type AdminMessage,
  type RenderedEmail,
} from "./email-templates";
import { logMessage } from "./repo/solicitudes";
import { getGmailCredentials } from "./repo/users";

/**
 * Correo saliente por Gmail (smtp.gmail.com:587, STARTTLS). Sin servicios de terceros.
 *
 * - Automáticos (confirmación al cliente, avisos a la agencia y al gestor): cuenta de la agencia
 *   (AGENCY_GMAIL_USER / AGENCY_GMAIL_APP_PASSWORD), remitente MAIL_FROM.
 * - Mensajes de cada usuario del panel: su Gmail conectado (gmailUser + contraseña de aplicación cifrada),
 *   con su dirección corporativa como remitente y Reply-To. Si no ha conectado Gmail, sale con la cuenta
 *   de la agencia y Reply-To su dirección corporativa, y la respuesta lo indica.
 *
 * Nunca lanza: devuelve el resultado y lo deja en MessageLog. Sin credenciales, el intento queda como
 * "error" con el motivo «Correo no configurado».
 */

export type MailStatus = "sent" | "error";

export const agencyAddress = () => process.env.MAIL_AGENCY ?? "";
const agencyUser = () => process.env.AGENCY_GMAIL_USER?.trim() ?? "";
const agencyPass = () => (process.env.AGENCY_GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
const fromAgency = () => process.env.MAIL_FROM || agencyUser();
export const agencyMailConfigured = () => Boolean(agencyUser() && agencyPass());

interface Credentials {
  user: string;
  pass: string;
}

function transporter({ user, pass }: Credentials): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
}

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string;
  attachments?: MailAttachment[];
}

/** Archivo adjunto tal como lo recibe la ruta (ya validado): nombre, tipo y bytes. */
export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

/** Envía con unas credenciales concretas. Devuelve el resultado sin lanzar. */
async function deliver(creds: Credentials, from: string, mail: OutgoingMail): Promise<{ status: MailStatus; error?: string }> {
  try {
    await transporter(creds).sendMail({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
      bcc: mail.bcc,
      attachments: mail.attachments,
    });
    return { status: "sent" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[mailer] error enviando «${mail.subject}» a ${mail.to}:`, error);
    return { status: "error", error };
  }
}

const NOT_CONFIGURED = "Correo no configurado: falta AGENCY_GMAIL_USER / AGENCY_GMAIL_APP_PASSWORD en el servidor.";

async function record(entry: {
  solicitudId?: string;
  to: string;
  from: string;
  sentById?: string;
  subject: string;
  kind: string;
  status: MailStatus;
  error?: string;
}) {
  try {
    await logMessage(entry);
  } catch (err) {
    console.error("[mailer] no se pudo registrar el envío", err);
  }
}

/** Correo automático desde la cuenta de la agencia. */
async function sendAgency(kind: string, mail: OutgoingMail, solicitudId?: string): Promise<MailStatus> {
  const from = fromAgency();
  const result = agencyMailConfigured()
    ? await deliver({ user: agencyUser(), pass: agencyPass() }, from, mail)
    : { status: "error" as const, error: NOT_CONFIGURED };
  await record({ solicitudId, to: mail.to, from, subject: mail.subject, kind, ...result });
  return result.status;
}

const rendered = (e: RenderedEmail, to: string, replyTo?: string, attachments?: MailAttachment[]): OutgoingMail => ({ to, subject: e.subject, html: e.html, text: e.text, replyTo, attachments });

/** Quién envía un mensaje desde el panel: su id y su dirección corporativa. */
export interface Sender {
  id: string;
  email: string;
}

export interface UserSendResult {
  status: MailStatus;
  error?: string;
  /** true si no tenía Gmail conectado y salió con la cuenta de la agencia. */
  viaAgency: boolean;
}

/** Envía un mensaje redactado por un usuario del panel (su Gmail, o la agencia como respaldo). */
async function sendAsUser(sender: Sender, kind: string, mail: OutgoingMail, solicitudId?: string): Promise<UserSendResult> {
  const own = await getGmailCredentials(sender.id);
  let from: string;
  let result: { status: MailStatus; error?: string };
  if (own) {
    from = sender.email;
    const bcc = own.bccSelf ? sender.email : undefined;
    result = await deliver({ user: own.user, pass: own.pass }, sender.email, { ...mail, replyTo: sender.email, bcc });
  } else {
    from = fromAgency();
    result = agencyMailConfigured()
      ? await deliver({ user: agencyUser(), pass: agencyPass() }, from, { ...mail, replyTo: sender.email })
      : { status: "error", error: NOT_CONFIGURED };
  }
  await record({ solicitudId, to: mail.to, from, sentById: sender.id, subject: mail.subject, kind, ...result });
  return { ...result, viaAgency: !own };
}

/* ---- Automáticos ----------------------------------------------------------------------------- */

/** Confirmación al cliente justo después del asistente. */
export function sendClientConfirmation(id: string, data: SolicitudInput, brand: EmailBrand) {
  return sendAgency("confirmacion", rendered(clientConfirmationEmail(id, data, brand), data.contacto.email, brand.email), id);
}

/** Aviso a la agencia con el brief de una solicitud nueva. */
export function notifyAgencyRequest(id: string, createdAt: string, data: SolicitudInput, prompt: string, brand: EmailBrand) {
  const to = agencyAddress() || brand.email;
  return sendAgency("aviso-agencia", rendered(agencyRequestEmail(id, createdAt, data, prompt, brand), to, data.contacto.email), id);
}

/** Aviso a la agencia de un mensaje del formulario corto. */
export function notifyAgencyContact(id: string, data: ContactoInput, brand: EmailBrand) {
  const to = agencyAddress() || brand.email;
  return sendAgency("aviso-agencia", rendered(agencyContactEmail(id, data, brand), to, data.email));
}

/** Aviso al gestor cuando se le asigna una solicitud, con el brief. */
export function notifyAssignee(id: string, createdAt: string, data: SolicitudInput, prompt: string, gestorEmail: string, brand: EmailBrand) {
  return sendAgency("aviso-gestor", rendered(agencyRequestEmail(id, createdAt, data, prompt, brand), gestorEmail, data.contacto.email), id);
}

/* ---- Desde el panel (cada usuario con su remitente) ------------------------------------------ */

/** Mensaje libre al cliente de una solicitud. */
export function sendClientMessage(sender: Sender, id: string, data: SolicitudInput, msg: AdminMessage, brand: EmailBrand, attachments?: MailAttachment[]) {
  return sendAsUser(sender, "admin", rendered(clientMessageEmail(id, data, msg, brand), data.contacto.email, undefined, attachments), id);
}

/** Respuesta a un mensaje del formulario de contacto (sin solicitud asociada). */
export function sendContactReply(sender: Sender, id: string, data: ContactoInput, msg: AdminMessage, brand: EmailBrand, attachments?: MailAttachment[]) {
  return sendAsUser(sender, "admin", rendered(contactReplyEmail(id, data, msg, brand), data.email, undefined, attachments));
}

/**
 * Prueba de una cuenta de Gmail antes de guardarla: envía al propio Gmail con el remitente corporativo.
 * No guarda nada; la ruta solo persiste las credenciales si esto sale bien.
 * Limitación: SMTP no informa si Gmail reescribió el remitente; eso hay que comprobarlo en el correo recibido.
 */
export async function sendGmailTest(creds: Credentials, corporate: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const mail: OutgoingMail = {
    to: creds.user,
    subject: "Prueba de envío · TuristaByBonestar",
    text: `Este correo confirma que ${creds.user} puede enviar desde el panel de TuristaByBonestar.\nRemitente de prueba: ${corporate}.`,
    html: `<p>Este correo confirma que <strong>${creds.user}</strong> puede enviar desde el panel de TuristaByBonestar.</p><p>Remitente de prueba: ${corporate}.</p>`,
    replyTo: corporate,
  };
  const result = await deliver(creds, corporate, mail);
  if (result.status === "sent") return { ok: true };
  return { ok: false, error: "Google rechazó la cuenta o la contraseña de aplicación. Revísalas e inténtalo de nuevo." };
}
