import "server-only";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { ZodType } from "zod";
import { CONTENT_TAG } from "@/lib/content";

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
