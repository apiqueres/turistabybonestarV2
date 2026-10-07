import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { getSettings } from "@/lib/repo/settings";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
