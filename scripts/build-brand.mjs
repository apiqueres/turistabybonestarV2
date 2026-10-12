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
  // 4b) loader layers (fractions measured on scratch/logo-grid.jpg): ring + sparkles, plane sprite,
  // camera, wordmark and a raster globe for the final cross-fade. All but the plane are full-size layers.
  const L = await sharp(light).resize({ width: 1024 }).png().toBuffer();
  const { data: ld, info: li } = await sharp(L).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const LW = li.width, LH = li.height, N = LW * LH;
  const PLANE = { left: Math.round(LW * 0.79), top: Math.round(LH * 0.11), width: Math.round(LW * 0.21), height: Math.round(LH * 0.2) };
  const G = { cx: 0.5 * LW, cy: 0.26 * LH, r: 0.217 * LW };
  const CAM = [[0.172, 0.345], [0.215, 0.345], [0.225, 0.305], [0.36, 0.305], [0.372, 0.345], [0.445, 0.345], [0.448, 0.525], [0.178, 0.53]];
  const inPoly = (px, py, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
  const isCyan = (i) => ld[i * 4 + 2] > 150 && ld[i * 4] < 110;
  // Swoosh centre line (same as TRAIL in Loader.tsx), sampled to find the ring where it passes in front of the globe.
  const SEG = [[358, 285, 240, 320, 90, 400, 88, 452], [88, 452, 92, 505, 250, 520, 430, 505], [430, 505, 560, 495, 660, 430, 740, 350], [740, 350, 800, 290, 860, 250, 916, 200]];
  const trail = [];
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of SEG) for (let t = 0; t <= 1; t += 0.01) { const u = 1 - t; trail.push([u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3, u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]); }
  const nearTrail = (x, y, d) => trail.some(([tx, ty]) => (tx - x) * (tx - x) + (ty - y) * (ty - y) < d * d);
  const layers = { ring: Buffer.alloc(N * 4), camera: Buffer.alloc(N * 4), words: Buffer.alloc(N * 4), globe: Buffer.alloc(N * 4) };
  const plane = Buffer.alloc(PLANE.width * PLANE.height * 4);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const i = y * LW + x; if (ld[i * 4 + 3] === 0) continue;
    const fx = x / LW, fy = y / LH;
    let dst = layers.ring;
    if (x >= PLANE.left && x < PLANE.left + PLANE.width && y >= PLANE.top && y < PLANE.top + PLANE.height) {
      const di = ((y - PLANE.top) * PLANE.width + (x - PLANE.left)) * 4;
      plane[di] = ld[i * 4]; plane[di + 1] = ld[i * 4 + 1]; plane[di + 2] = ld[i * 4 + 2]; plane[di + 3] = ld[i * 4 + 3];
      continue;
    }
    if (Math.hypot(x - G.cx, y - G.cy) <= G.r && !(y > G.cy && nearTrail(x, y, 46))) dst = layers.globe; // the lower swoosh crosses in front of the globe
    else if (inPoly(fx, fy, CAM)) dst = layers.camera;
    else if (fy > 0.86 || ((fy > 0.5 || (fy > 0.46 && fx > 0.6)) && !isCyan(i))) dst = layers.words; // letters (the "A" apex rises above the half line) + subtitle
    else if (fy < 0.27 && (fx < 0.4 || fx > 0.66)) dst = layers.words;                          // sparkles appear with the wordmark
    dst[i * 4] = ld[i * 4]; dst[i * 4 + 1] = ld[i * 4 + 1]; dst[i * 4 + 2] = ld[i * 4 + 2]; dst[i * 4 + 3] = ld[i * 4 + 3];
  }
  // The camera hides a stretch of the swoosh in the logo. Paint it into the ring layer along the trail so the
  // plane leaves an unbroken trail; the camera covers it again when it lands.
  {
    const R = 19, col = [20, 168, 212];
    const band = new Uint8Array(N); // coverage of the painted band (max over the discs, so the edges stay smooth)
    for (const [tx, ty] of trail) {
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const d2 = dx * dx + dy * dy; if (d2 > R * R) continue;
        const x = Math.round(tx + dx), y = Math.round(ty + dy); if (x < 0 || y < 0 || x >= LW || y >= LH) continue;
        if (!inPoly(x / LW, y / LH, CAM)) continue; // only where the camera will cover it
        const a = Math.round(255 * Math.max(0, Math.min(1, (R - Math.sqrt(d2)) / 2.5)));
        const i = y * LW + x; if (a > band[i]) band[i] = a;
      }
    }
    for (let i = 0; i < N; i++) {
      if (!band[i] || layers.ring[i * 4 + 3] > 0) continue;
      layers.ring[i * 4] = col[0]; layers.ring[i * 4 + 1] = col[1]; layers.ring[i * 4 + 2] = col[2]; layers.ring[i * 4 + 3] = band[i];
    }
  }
  for (const [name, buf] of Object.entries(layers)) await sharp(buf, { raw: { width: LW, height: LH, channels: 4 } }).resize({ width: 768 }).png({ palette: true, quality: 90 }).toFile(`public/brand/loader-${name}.png`);
  await sharp(plane, { raw: { width: PLANE.width, height: PLANE.height, channels: 4 } }).png().toFile("public/brand/loader-plane.png");
  console.log("loader layers", JSON.stringify({ W: LW, H: LH, plane: PLANE, globe: G }));
  // 5) preview sheet: full light on white, full dark on ink, marks
  const tile = async (buf, bg, w, h) => sharp({ create: { width: w, height: h, channels: 4, background: bg } }).composite([{ input: await sharp(buf).resize({ width: w - 40, height: h - 40, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), gravity: "centre" }]).png().toBuffer();
  const tiles = [await tile(light, "#ffffff", 520, 440), await tile(dark, "#0b0f10", 520, 440), await tile(markLight, "#ffffff", 260, 440), await tile(markDark, "#0b0f10", 260, 440)];
  let x = 0; const comp = [];
  for (const t of tiles) { const m = await sharp(t).metadata(); comp.push({ input: t, top: 0, left: x }); x += m.width; }
  await sharp({ create: { width: x, height: 440, channels: 4, background: "#888" } }).composite(comp).jpeg({ quality: 85 }).toFile("scratch/brand-preview.jpg");
  console.log("brand ok", meta.width, meta.height, "mark cut", cutY);
})();
