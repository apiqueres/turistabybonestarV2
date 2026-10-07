import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody, revalidateContent } from "@/lib/admin/api-utils";
import { listOffers, reorderOffers, upsertOffer } from "@/lib/repo/ofertas";
import { offerSchema, reorderSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({ ok: true, offers: await listOffers({ all: true }) });
}

export async function PUT(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, offerSchema);
  if (bad) return bad;
  try {
    const offer = await upsertOffer(data);
    revalidateContent();
    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    return dbError("admin/ofertas", err);
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, reorderSchema);
  if (bad) return bad;
  try {
    await reorderOffers(data.ids);
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/ofertas", err);
  }
}
