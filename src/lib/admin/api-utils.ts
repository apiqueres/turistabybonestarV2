import "server-only";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { ZodType } from "zod";
import { CONTENT_TAG } from "@/lib/content";
import { ATTACHMENT_MAX_FILES, ATTACHMENT_MAX_TOTAL, ATTACHMENT_MAX_EACH, attachmentType, cleanFilename, matchesSignature } from "@/lib/attachments";
import type { MailAttachment } from "@/lib/mailer";

/** Lee y valida el cuerpo JSON; devuelve los datos o una respuesta 400 lista para devolver. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` (${first.path.join(".")})` : "";
    return { error: NextResponse.json({ ok: false, error: `${first?.message ?? "Datos incompletos"}${where}`, issues: parsed.error.issues }, { status: 400 }) };
  }
  return { data: parsed.data };
}

/** Invalida el contenido público cacheado; la siguiente petición vuelve a leer la base de datos. */
export function revalidateContent() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
}

/** Respuesta de error uniforme para fallos de la base de datos. */
export function dbError(scope: string, err: unknown): NextResponse {
  const code = (err as { code?: string })?.code;
  if (code === "P2003") return NextResponse.json({ ok: false, error: "Referencia inválida: el destino indicado no existe o el elemento tiene ofertas asociadas." }, { status: 409 });
  if (code === "P2025") return NextResponse.json({ ok: false, error: "No existe." }, { status: 404 });
  if (code === "P2002") return NextResponse.json({ ok: false, error: "Ya existe un elemento con ese id o slug." }, { status: 409 });
  console.error(`[${scope}]`, err);
  return NextResponse.json({ ok: false, error: "Error en el servidor" }, { status: 500 });
}

const bad = (error: string, status = 400) => ({ error: NextResponse.json({ ok: false, error }, { status }) });

/**
 * Cuerpo de un mensaje del panel con adjuntos opcionales. Acepta JSON (sin adjuntos) o multipart con el campo
 * `message` (JSON) y uno o varios `files`. Comprueba tipo (por extensión y primeros bytes), número y tamaño.
 */
export async function parseMessageWithFiles<T extends { attachments?: string[] }>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; files: MailAttachment[]; error?: undefined } | { data?: undefined; files?: undefined; error: NextResponse }> {
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
    const r = await parseBody(req, schema);
    return r.error ? r : { data: { ...r.data, attachments: undefined }, files: [] };
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Se esperaba un formulario multipart");
  }
  let body: unknown;
  try {
    body = JSON.parse(String(form.get("message") ?? ""));
  } catch {
    return bad("JSON inválido");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Datos incompletos");
  const raw = form.getAll("files").filter((f): f is File => f instanceof File);
  if (raw.length > ATTACHMENT_MAX_FILES) return bad(`Como máximo ${ATTACHMENT_MAX_FILES} adjuntos`);
  const files: MailAttachment[] = [];
  let total = 0;
  for (const f of raw) {
    const filename = cleanFilename(f.name);
    const contentType = attachmentType(filename);
    if (!contentType) return bad(`«${filename}»: solo PDF, JPG, PNG o WebP`, 415);
    if (f.size === 0) return bad(`«${filename}» está vacío`);
    if (f.size > ATTACHMENT_MAX_EACH) return bad(`«${filename}» supera el tamaño máximo por archivo`, 413);
    total += f.size;
    if (total > ATTACHMENT_MAX_TOTAL) return bad("Los adjuntos superan el tamaño máximo total", 413);
    const content = Buffer.from(await f.arrayBuffer());
    if (!matchesSignature(contentType, content.subarray(0, 12))) return bad(`«${filename}» no es un ${contentType === "application/pdf" ? "PDF" : "archivo de imagen"} válido`, 415);
    files.push({ filename, contentType, content });
  }
  // Los nombres que lista el correo son los de los archivos realmente recibidos.
  return { data: { ...parsed.data, attachments: files.map((f) => f.filename) }, files };
}
