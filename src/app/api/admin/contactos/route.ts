import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { listContactos } from "@/lib/repo/contactos";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  const url = new URL(req.url);
  const page = await listContactos({ page: Number(url.searchParams.get("page")) || 1, pending: url.searchParams.get("pendientes") === "1" });
  return NextResponse.json({ ok: true, ...page });
}
