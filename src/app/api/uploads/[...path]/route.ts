import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { diskPath } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Sirve las imágenes subidas cuando no hay Nginx delante (desarrollo, Docker solo).
 * next.config.ts reescribe /uploads/* hacia aquí; en el VPS, Nginx sirve /uploads/ con `alias`.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const abs = diskPath(`/uploads/${path.join("/")}`);
  if (!abs) return new NextResponse("Not found", { status: 404 });
  try {
    const [buf, info] = await Promise.all([readFile(abs), stat(abs)]);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=604800, immutable",
        "Last-Modified": info.mtime.toUTCString(),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
