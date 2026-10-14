/** Adjuntos de los correos del panel: límites y tipos compartidos por el compositor (cliente) y las rutas (servidor). */

export const ATTACHMENT_MAX_FILES = 5;
export const ATTACHMENT_MAX_TOTAL = 15 * 1024 * 1024; // Gmail rechaza a partir de 25 MB; dejamos margen para el HTML.
export const ATTACHMENT_MAX_EACH = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

const TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Nombre limpio (sin rutas ni caracteres de control) y acotado. */
export function cleanFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "adjunto";
  return base.replace(/[\x00-\x1f]/g, "").trim().slice(0, 120) || "adjunto";
}

/** Tipo MIME según la extensión, o null si no es PDF / JPG / PNG / WebP. */
export function attachmentType(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return TYPES[ext] ?? null;
}

/** Primer problema de una lista de archivos elegidos, o null si todos valen. */
export function attachmentsProblem(files: { name: string; size: number }[]): string | null {
  if (files.length > ATTACHMENT_MAX_FILES) return `Como máximo ${ATTACHMENT_MAX_FILES} archivos.`;
  for (const f of files) {
    if (!attachmentType(f.name)) return `«${f.name}»: solo PDF, JPG, PNG o WebP.`;
    if (f.size === 0) return `«${f.name}» está vacío.`;
    if (f.size > ATTACHMENT_MAX_EACH) return `«${f.name}» supera los ${formatBytes(ATTACHMENT_MAX_EACH)}.`;
  }
  const total = files.reduce((a, f) => a + f.size, 0);
  if (total > ATTACHMENT_MAX_TOTAL) return `Los adjuntos suman ${formatBytes(total)}; el máximo es ${formatBytes(ATTACHMENT_MAX_TOTAL)}.`;
  return null;
}

/** Comprueba que los primeros bytes corresponden al tipo declarado (PDF, JPEG, PNG o WebP). */
export function matchesSignature(type: string, head: Uint8Array): boolean {
  const str = (from: number, len: number) => String.fromCharCode(...head.slice(from, from + len));
  switch (type) {
    case "application/pdf":
      return str(0, 4) === "%PDF";
    case "image/jpeg":
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "image/png":
      return head[0] === 0x89 && str(1, 3) === "PNG";
    case "image/webp":
      return str(0, 4) === "RIFF" && str(8, 4) === "WEBP";
    default:
      return false;
  }
}
