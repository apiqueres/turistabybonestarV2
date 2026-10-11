import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { getSettings } from "@/lib/repo/settings";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
