import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody, revalidateContent } from "@/lib/admin/api-utils";
import { listDestinations, reorderDestinations, upsertDestination } from "@/lib/repo/destinos";
import { destinationUpsertSchema, reorderSchema } from "@/lib/validation-admin";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({ ok: true, destinations: await listDestinations({ all: true }) });
}

/** Crea o actualiza un destino. */
export async function PUT(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, destinationUpsertSchema);
  if (bad) return bad;
  const slug = slugify(data.destination.name);
  if (!slug) return NextResponse.json({ ok: false, error: "El nombre necesita alguna letra o número." }, { status: 400 });
  try {
    const destination = await upsertDestination({ ...data.destination, slug }, data.previousId);
    revalidateContent();
    return NextResponse.json({ ok: true, destination });
  } catch (err) {
    return dbError("admin/destinos", err);
  }
}

/** Nuevo orden (lista completa de ids). */
export async function PATCH(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, reorderSchema);
  if (bad) return bad;
  try {
    await reorderDestinations(data.ids);
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/destinos", err);
  }
}
