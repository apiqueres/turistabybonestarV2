import { NextResponse } from "next/server";
import { contactoSchema } from "@/lib/validation";
import { saveRecord } from "@/lib/store";

export const runtime = "nodejs";

/** Receives the short contact form and stores it as data/contacto/<id>.json */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const parsed = contactoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos incompletos", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const record = await saveRecord("contacto", parsed.data);
    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("[contacto] no se pudo guardar", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}
