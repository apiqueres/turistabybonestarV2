import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { getSolicitud } from "@/lib/repo/solicitudes";

export const runtime = "nodejs";

/** Descarga el brief .txt de una solicitud. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { id } = await params;
  const row = await getSolicitud(id);
  if (!row) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  return new NextResponse(row.prompt ?? "", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id.replace(/[^\w.-]/g, "_")}.txt"`,
    },
  });
}
