import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, revalidateContent } from "@/lib/admin/api-utils";
import { deleteDestination } from "@/lib/repo/destinos";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser();
  if (error) return error;
  try {
    await deleteDestination((await params).id);
    revalidateContent();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/destinos", err);
  }
}
