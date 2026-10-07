import { NextResponse } from "next/server";
import { db, hasDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Comprobación de salud (healthcheck de Docker y vigilancia externa): 200 si la web y la BD responden. */
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ ok: true, db: "none" });
  try {
    await db().$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok" });
  } catch (err) {
    console.error("[health] base de datos no disponible", err);
    return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
  }
}
