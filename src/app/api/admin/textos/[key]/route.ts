import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody, revalidateContent } from "@/lib/admin/api-utils";
import { saveSetting } from "@/lib/repo/settings";
import { settingSchemas } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Guarda un bloque de texto de la web (validado con el esquema de su clave). */
export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { key } = await params;
  const schema = (settingSchemas as unknown as Record<string, ZodType<unknown> | undefined>)[key];
  if (!schema) return NextResponse.json({ ok: false, error: "Bloque desconocido" }, { status: 404 });
  const { data, error: bad } = await parseBody(req, schema);
  if (bad) return bad;
  try {
    await saveSetting(key as keyof typeof settingSchemas, data);
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/textos", err);
  }
}
