import { NextResponse } from "next/server";
import { solicitudSchema } from "@/lib/validation";
import { saveRecord } from "@/lib/store";
import { buildPrompt } from "@/lib/prompt";

export const runtime = "nodejs";

/** Receives the "Cómo viajas" wizard and stores data/solicitudes/<id>.json plus a readable <id>.txt brief */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos incompletos", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const record = await saveRecord("solicitudes", parsed.data, (id, createdAt) => buildPrompt(id, createdAt, parsed.data));
    return NextResponse.json({ ok: true, id: record.id, prompt: record.prompt });
  } catch (err) {
    console.error("[solicitudes] no se pudo guardar", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}
