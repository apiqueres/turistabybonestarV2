// Searches Wikimedia Commons for real, freely licensed photos and downloads them as WebP.
// Usage: node scripts/fetch-commons.mjs scripts/commons-queries.json
// Writes public/media/<name>.webp and appends credits to public/media/credits.json
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const queries = JSON.parse(readFileSync(process.argv[2], "utf8"));
const creditsPath = "public/media/credits.json";
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};
const OK = /(cc0|cc[ -]by|public domain|^pdb|no restrictions)/i;
const headers = { "User-Agent": "TuristaByBonestar-site/1.0 (photo picker; contact: alevaljau01@gmail.com)" };

async function search(q, extra = "") {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "25",
    gsrsearch: `${q} filemime:image/jpeg ${extra}`.trim(),
    prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1800",
  }).toString();
  const res = await fetch(url, { headers });
  const json = await res.json();
  return Object.values(json.query?.pages ?? {}).map((p) => {
    const ii = p.imageinfo?.[0]; const md = ii?.extmetadata ?? {};
    return { title: p.title, width: ii?.width, height: ii?.height, thumb: ii?.thumburl, page: ii?.descriptionurl,
      license: md.LicenseShortName?.value ?? "", artist: (md.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() };
  }).filter((r) => r.thumb && r.width >= 1400 && OK.test(r.license));
}

for (const [name, spec] of Object.entries(queries)) {
  const { q, pick = 0, minRatio = 0, maxRatio = 99, list = false } = typeof spec === "string" ? { q: spec } : spec;
  let results = await search(q, 'incategory:"Quality images"');
  if (results.length <= pick) results = results.concat(await search(q));
  results = results.filter((r) => r.width / r.height >= minRatio && r.width / r.height <= maxRatio);
  if (list) { results.forEach((r, i) => console.log(name, i, r.title, (r.width / r.height).toFixed(2), r.license)); continue; }
  const r = results[pick];
  if (!r) { console.log("NO RESULT", name, q); continue; }
  const buf = Buffer.from(await (await fetch(r.thumb, { headers })).arrayBuffer());
  await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/media/${name}.webp`);
  credits[name] = { title: r.title, author: r.artist, license: r.license, source: r.page };
  console.log("saved", name, "<-", r.title, "|", r.license, "|", r.artist.slice(0, 40), `| ${results.length} candidates`);
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
