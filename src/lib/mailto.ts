"use client";

/**
 * Solo para la DEMO estática (GitHub Pages), donde no hay servidor que envíe correo:
 * abre el programa de correo del visitante con un `mailto:` ya relleno.
 * En el VPS el correo lo envía el servidor por SMTP (src/lib/mailer.ts).
 */
export interface MailtoMail {
  to: string;
  subject: string;
  text: string;
}

export function mailtoLink({ to, subject, text }: MailtoMail): string {
  // Mail clients cap the URL length; keep the body under ~1800 characters.
  const body = text.length > 1800 ? `${text.slice(0, 1750)}\n\n[… brief recortado, el resto va en el fichero .txt]` : text;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function openMailto(mail: MailtoMail) {
  window.location.href = mailtoLink(mail);
}
