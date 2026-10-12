// Builds the brand files from the light logo generated with Higgsfield (scratch/logo-light-a.png):
// full logo (light/dark), emblem marks, favicon and the loader layers. Run: node scripts/build-brand.mjs
import sharp from "sharp";
const SRC = "scratch/logo-light-a.png";
(async () => {
  // 1) trim the light version (black text + cyan emblem) to its bounding box
  const light0 = await sharp(SRC).trim().png().toBuffer();
  const meta = await sharp(light0).metadata();
  // the generated logo carries a tiny stray cyan dash to the right of the "A": blank that corner
  const { data: d0, info: i0 } = await sharp(light0).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = Math.round(i0.height * 0.52); y < Math.round(i0.height * 0.68); y++) for (let x = Math.round(i0.width * 0.93); x < i0.width; x++) {
    const i = (y * i0.width + x) * 4; const r = d0[i], b = d0[i + 2];
    if (b > 150 && r < 110) d0[i + 3] = 0;
  }
  const light = await sharp(d0, { raw: { width: i0.width, height: i0.height, channels: 4 } }).png().toBuffer();
  // 2) dark version: near-black, low-saturation pixels -> white; cyan stays
  const { data, info } = await sharp(light).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a === 0) continue;
    // ink = dark pixel that is not cyan (cyan has a strong blue channel)
    if (Math.max(r, data[i * 4 + 1], b) < 120 && !(b > 150 && r < 110)) { out[i * 4] = 255; out[i * 4 + 1] = 255; out[i * 4 + 2] = 255; }
  }
  const dark = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  // 3) emblem mark: upper part above the wordmark (TURISTA starts around 60% of the height)
  const cutY = Math.round(meta.height * 0.62);
  const inkFrom = Math.round(meta.height * 0.5); // below this line only the orbit ring (cyan) belongs to the emblem
  const markOf = async (buf) => {
    const { data: d, info: inf } = await sharp(buf).extract({ left: 0, top: 0, width: meta.width, height: cutY }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const o = Buffer.from(d);
    for (let y = Math.round(meta.height * 0.42); y < inf.height; y++) for (let x = 0; x < inf.width; x++) {
      if (y < inkFrom && x < meta.width * 0.55) continue; // the camera keeps its ink; the "A" apex on the right does not
      const i = (y * inf.width + x) * 4;
      const r = d[i], b = d[i + 2];
      if (!(b > 150 && r < 110)) o[i + 3] = 0; // drop everything that is not cyan: tops of the letters
    }
    return sharp(o, { raw: { width: inf.width, height: inf.height, channels: 4 } }).trim().png();
  };
  const markLight = await (await markOf(light)).toBuffer();
  const markDark = await (await markOf(dark)).toBuffer();
  const save = async (buf, name, widths) => {
    for (const w of widths) await sharp(buf).resize({ width: w }).png().toFile(`public/brand/${name}-${w}.png`);
  };
  await save(light, "logo-full-light", [512, 1024]);
  await save(dark, "logo-full-dark", [512, 1024]);
  await save(markLight, "logo-mark-light", [96, 192]);
  await save(markDark, "logo-mark-dark", [96, 192]);
  // 4) favicon: emblem on white
  const icon = await sharp(markLight).resize({ width: 52, height: 52, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 64, height: 64, channels: 4, background: "#ffffff" } }).composite([{ input: icon, gravity: "centre" }]).png().toFile("src/app/icon.png");
  // 4b) loader sprites (fractions measured on scratch/logo-grid.jpg): the plane and the camera, trimmed.
  const L = await sharp(light).resize({ width: 1024 }).png().toBuffer();
  const { data: ld, info: li } = await sharp(L).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const LW = li.width, LH = li.height;
  // tight outline of the camera body (the swoosh brushes its box on every side)
  const CAM = [[0.19, 0.36], [0.23, 0.36], [0.238, 0.318], [0.347, 0.318], [0.362, 0.36], [0.44, 0.36], [0.44, 0.506], [0.19, 0.506]];
  const inPoly = (px, py, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
  const PLANE = { left: Math.round(LW * 0.79), top: Math.round(LH * 0.11), width: Math.round(LW * 0.21), height: Math.round(LH * 0.2) };
  const cam = Buffer.alloc(LW * LH * 4);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const i = (y * LW + x) * 4;
    const fx = x / LW, fy = y / LH;
    if (ld[i + 3] && inPoly(fx, fy, CAM)) { cam[i] = ld[i]; cam[i + 1] = ld[i + 1]; cam[i + 2] = ld[i + 2]; cam[i + 3] = ld[i + 3]; }
  }
  await sharp(cam, { raw: { width: LW, height: LH, channels: 4 } }).trim().png().toFile("public/brand/loader-camera.png");
  await sharp(L).extract(PLANE).trim().png().toFile("public/brand/loader-plane.png");
  console.log("loader sprites ok");
  // 5) preview sheet: full light on white, full dark on ink, marks
  const tile = async (buf, bg, w, h) => sharp({ create: { width: w, height: h, channels: 4, background: bg } }).composite([{ input: await sharp(buf).resize({ width: w - 40, height: h - 40, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), gravity: "centre" }]).png().toBuffer();
  const tiles = [await tile(light, "#ffffff", 520, 440), await tile(dark, "#0b0f10", 520, 440), await tile(markLight, "#ffffff", 260, 440), await tile(markDark, "#0b0f10", 260, 440)];
  let x = 0; const comp = [];
  for (const t of tiles) { const m = await sharp(t).metadata(); comp.push({ input: t, top: 0, left: x }); x += m.width; }
  await sharp({ create: { width: x, height: 440, channels: 4, background: "#888" } }).composite(comp).jpeg({ quality: 85 }).toFile("scratch/brand-preview.jpg");
  console.log("brand ok", meta.width, meta.height, "mark cut", cutY);
})();
