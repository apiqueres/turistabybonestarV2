// Converts the black-on-white source logo into transparent black and white variants,
// and builds the site icon (light background, black mark).
import sharp from "sharp";

const src = "public/brand/logo-source.png";
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

function tinted(r0, g0, b0) {
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const alpha = Math.round((255 - lum) * (a / 255));
    out[i * 4] = r0; out[i * 4 + 1] = g0; out[i * 4 + 2] = b0; out[i * 4 + 3] = alpha;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim();
}

for (const [name, rgb] of [["white", [255, 255, 255]], ["black", [11, 15, 16]]]) {
  const base = tinted(...rgb);
  await base.clone().png().toFile(`public/brand/logo-${name}.png`);
  await base.clone().resize({ width: 512 }).png().toFile(`public/brand/logo-${name}-512.png`);
  await base.clone().resize({ width: 96 }).png().toFile(`public/brand/logo-${name}-96.png`);
}
const icon = await tinted(11, 15, 16).resize({ width: 44, height: 44, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 64, height: 64, channels: 4, background: "#ffffff" } }).composite([{ input: icon, gravity: "centre" }]).png().toFile("src/app/icon.png");
console.log("logo ok", info.width, info.height);
