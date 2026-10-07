import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody } from "@/lib/admin/api-utils";
import { deleteContacto, setContactoHandled } from "@/lib/repo/contactos";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, z.object({ handled: z.boolean() }));
  if (bad) return bad;
  try {
    return NextResponse.json({ ok: true, contact: await setContactoHandled((await params).id, data.handled) });
  } catch (err) {
    return dbError("admin/contactos", err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireApiUser();
  if (error) return error;
  try {
    await deleteContacto((await params).id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/contactos", err);
  }
}
