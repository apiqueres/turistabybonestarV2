import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody, revalidateContent } from "@/lib/admin/api-utils";
import { getFormSteps, saveFormSteps } from "@/lib/repo/form";
import { formStepsSchema } from "@/lib/validation-admin";
import { formContent } from "@/data/form";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({ ok: true, steps: (await getFormSteps()) ?? formContent.steps });
}

/** Guarda las páginas del asistente completas. */
export async function PUT(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, formStepsSchema);
  if (bad) return bad;
  try {
    await saveFormSteps(data);
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/preguntas", err);
  }
}
