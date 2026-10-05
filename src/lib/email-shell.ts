/**
 * HTML e-mail shell in the visual language of the site: white paper, near-black ink,
 * cyan accent, serif headlines and monospaced labels. Table-based and inline-styled
 * so it renders in mail clients; Google Fonts are linked for the clients that allow it.
 */

export interface EmailBrand {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  hours: string;
}

export type EmailBlock =
  | { kind: "p"; text: string }
  | { kind: "chips"; title: string; items: string[] }
  | { kind: "rows"; title: string; rows: [string, string][] }
  | { kind: "note"; title: string; items: string[] }
  | { kind: "signature"; lines: string[] };

export interface EmailSpec {
  preheader: string;
  kicker: string;
  title: string;
  blocks: EmailBlock[];
  brand: EmailBrand;
  siteUrl: string;
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INK = "#0b0f10", MUTED = "#6b7073", LINE = "#e3e7e8", PAPER = "#ffffff", ALT = "#f4f7f8", ACCENT = "#00b4d8";
const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";
const SANS = "Inter, Helvetica, Arial, sans-serif";

const label = (t: string) =>
  `<div style="font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};margin:0 0 8px">${esc(t)}</div>`;

function renderBlock(b: EmailBlock): string {
  switch (b.kind) {
    case "p":
      return `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:${INK};margin:0 0 18px">${esc(b.text).replace(/\n/g, "<br>")}</p>`;
    case "chips":
      return `<div style="margin:0 0 24px">${label(b.title)}${b.items
        .map((i) => `<span style="display:inline-block;background:${INK};color:${PAPER};font-family:${MONO};font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:9px 12px;margin:0 6px 6px 0">${esc(i)}</span>`)
        .join("")}</div>`;
    case "rows":
      return `<div style="margin:0 0 24px">${label(b.title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE}">${b.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE};font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};width:42%;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};vertical-align:top">${esc(v)}</td></tr>`,
        )
        .join("")}</table></div>`;
    case "note":
      return `<div style="background:${ALT};padding:20px;margin:0 0 24px">${label(b.title)}<ol style="margin:0;padding-left:18px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">${b.items.map((i) => `<li style="margin:0 0 6px">${esc(i)}</li>`).join("")}</ol></div>`;
    case "signature":
      return `<p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};margin:28px 0 0">${b.lines.map(esc).join("<br>")}</p>`;
  }
}

export function renderEmailHtml(spec: EmailSpec): string {
  const { brand, siteUrl } = spec;
  const logo = `${siteUrl.replace(/\/$/, "")}/brand/logo-black-512.png`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(spec.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${ALT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(spec.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ALT}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PAPER};border:1px solid ${LINE}">
  <tr><td style="padding:22px 32px;border-bottom:1px solid ${LINE}">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px"><img src="${logo}" width="54" alt="" style="display:block;width:54px;height:auto"></td>
      <td style="font-family:${MONO};font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${INK}">Turista<span style="color:${MUTED}"> by </span>Bonestar</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:${ACCENT};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:36px 32px 8px">
    <div style="font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};margin:0 0 14px">${esc(spec.kicker)}</div>
    <h1 style="font-family:${SERIF};font-weight:400;font-size:40px;line-height:1.05;letter-spacing:-.01em;color:${INK};margin:0 0 24px">${esc(spec.title)}</h1>
    ${spec.blocks.map(renderBlock).join("")}
  </td></tr>
  <tr><td style="padding:24px 32px;border-top:1px solid ${LINE};background:${ALT}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};line-height:1.9">
        ${esc(brand.name)}<br>${esc(brand.city)} · ${esc(brand.hours)}<br>
        <a href="mailto:${esc(brand.email)}" style="color:${INK};text-decoration:none">${esc(brand.email)}</a> · ${esc(brand.phone)}<br>
        WhatsApp ${esc(brand.whatsapp)}
      </td>
    </tr></table>
  </td></tr>
</table>
<p style="font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};margin:16px 0 0">Recibes este correo porque has enviado una solicitud en ${esc(siteUrl.replace(/^https?:\/\//, ""))}</p>
</td></tr></table>
</body></html>`;
}

/** Plain-text twin of the HTML (for mailto: and as the text part). */
export function renderEmailText(spec: EmailSpec): string {
  const lines: string[] = [spec.kicker.toUpperCase(), spec.title, ""];
  for (const b of spec.blocks) {
    if (b.kind === "p") lines.push(b.text, "");
    if (b.kind === "chips") lines.push(`${b.title.toUpperCase()}: ${b.items.join(", ")}`, "");
    if (b.kind === "rows") lines.push(b.title.toUpperCase(), ...b.rows.map(([k, v]) => `- ${k}: ${v}`), "");
    if (b.kind === "note") lines.push(b.title.toUpperCase(), ...b.items.map((i, n) => `${n + 1}. ${i}`), "");
    if (b.kind === "signature") lines.push(...b.lines, "");
  }
  lines.push("—", spec.brand.name, `${spec.brand.city} · ${spec.brand.hours}`, `${spec.brand.email} · ${spec.brand.phone} · WhatsApp ${spec.brand.whatsapp}`);
  return lines.join("\n");
}
