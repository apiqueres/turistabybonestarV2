// Downloads generated media (Higgsfield result URLs) into public/media and optimizes stills to WebP.
import { writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
const [, , manifestPath] = process.argv;
const manifest = JSON.parse((await import("node:fs")).readFileSync(manifestPath, "utf8"));
mkdirSync("public/media", { recursive: true });
for (const [name, url] of Object.entries(manifest)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (name.endsWith(".mp4")) { writeFileSync(`public/media/${name}`, buf); console.log("saved", name, buf.length); continue; }
  const img = sharp(buf);
  const meta = await img.metadata();
  const width = Math.min(meta.width ?? 1600, name.startsWith("pan-") ? 2400 : name.startsWith("hero") ? 1920 : 1400);
  await img.resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/media/${name}.webp`);
  console.log("saved", `${name}.webp`, meta.width, "->", width);
}
