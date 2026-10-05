"use client";

/**
 * Front-only e-mail for the demo (no backend involved).
 *  - If NEXT_PUBLIC_EMAILJS_SERVICE / TEMPLATE / PUBLIC_KEY are set, the message is sent
 *    through EmailJS's public REST API from the browser.
 *  - Otherwise a prefilled `mailto:` link opens the visitor's own mail client.
 */
const SERVICE = process.env.NEXT_PUBLIC_EMAILJS_SERVICE;
const TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export const emailJsConfigured = Boolean(SERVICE && TEMPLATE && PUBLIC_KEY);

export interface DemoMail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  fromName?: string;
}

export function mailtoLink({ to, subject, text }: DemoMail): string {
  // Mail clients cap the URL length; keep the body under ~1800 characters.
  const body = text.length > 1800 ? `${text.slice(0, 1750)}\n\n[… brief recortado, el resto va en el fichero .txt]` : text;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Returns "sent" (EmailJS) or "mailto" (the mail client was opened). Throws on EmailJS failure. */
export async function sendDemoMail(mail: DemoMail): Promise<"sent" | "mailto"> {
  if (emailJsConfigured) {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE,
        template_id: TEMPLATE,
        user_id: PUBLIC_KEY,
        template_params: { to_email: mail.to, subject: mail.subject, message: mail.text, reply_to: mail.replyTo ?? "", from_name: mail.fromName ?? "Web TuristaByBonestar" },
      }),
    });
    if (!res.ok) throw new Error(`EmailJS ${res.status}`);
    return "sent";
  }
  window.location.href = mailtoLink(mail);
  return "mailto";
}
