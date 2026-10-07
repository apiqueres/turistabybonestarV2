// Builds the offline city index used by the destination search (src/generated/cities.json).
// Source: GeoNames cities15000 (CC BY 4.0). Keeps cities of 100k+ inhabitants, every capital and a
// curated list of tourist spots. Run: node scripts/build-cities.mjs [dir with cities15000.txt + countryInfo.txt]
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const dir = process.argv[2] || "scratch/geonames";
mkdirSync(dir, { recursive: true });
const fetchIfMissing = (name, url, unzip) => {
  const file = join(dir, name);
  if (existsSync(file)) return file;
  console.log("downloading", url);
  execSync(`curl -sL -o "${unzip ? file + ".zip" : file}" ${url}`);
  if (unzip) execSync(`unzip -o -q "${file}.zip" -d "${dir}"`);
  return file;
};
const citiesFile = fetchIfMissing("cities15000.txt", "https://download.geonames.org/export/dump/cities15000.zip", true);
const infoFile = fetchIfMissing("countryInfo.txt", "https://download.geonames.org/export/dump/countryInfo.txt", false);

const map = JSON.parse(readFileSync("src/generated/world-map.json", "utf8"));
const esNames = new Map(map.countries.map((c) => [c.id, c.name]));
const exonyms = JSON.parse(readFileSync("src/data/city-names.es.json", "utf8"));
const MUST = new Set(Object.keys(exonyms)); // tourist spots kept regardless of population

const iso = new Map(); // ISO2 -> { num, name }
for (const line of readFileSync(infoFile, "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const c = line.split("\t");
  iso.set(c[0], { num: c[2], name: c[4] });
}

const latin = /^[A-Za-z\u00C0-\u024F' .-]+$/;
const accented = /[\u00C0-\u024F]/;
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const rows = [];
for (const line of readFileSync(citiesFile, "utf8").split("\n")) {
  if (!line) continue;
  const c = line.split("\t");
  const [id, name, ascii, alts, lat, lon, , fcode, cc] = c;
  const pop = Number(c[14]) || 0;
  if (!(pop >= 100000 || fcode === "PPLC" || MUST.has(name))) continue;
  const country = iso.get(cc);
  if (!country) continue;
  const display = exonyms[name] || name;
  const seen = new Set([norm(display), norm(name), norm(ascii)]);
  const extra = [];
  for (const a of alts.split(",")) {
    if (!a || a.length > 28 || !latin.test(a) || !accented.test(a)) continue; // keep local/Spanish spellings, drop transliterations
    const n = norm(a);
    if (seen.has(n)) continue;
    seen.add(n);
    extra.push(a);
    if (extra.length >= 3) break;
  }
  if (norm(name) !== norm(display)) extra.unshift(name);
  if (norm(ascii) !== norm(name) && norm(ascii) !== norm(display)) extra.push(ascii);
  rows.push([Number(id), display, country.num, +Number(lat).toFixed(3), +Number(lon).toFixed(3), pop, extra.slice(0, 4)]);
}
rows.sort((a, b) => b[5] - a[5]);
const countries = Object.fromEntries([...iso.values()].map((c) => [c.num, esNames.get(c.num) || c.name]));
const iso2 = Object.fromEntries([...iso.entries()].map(([k, c]) => [k, c.num]));
writeFileSync("src/generated/cities.json", JSON.stringify({ countries, iso2, cities: rows }));
console.log("cities ok", rows.length, "cities,", Math.round(JSON.stringify(rows).length / 1024), "KB");
