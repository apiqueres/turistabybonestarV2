import map from "@/generated/world-map.json";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

/** A place the client can ask for: a whole country (id = ISO numeric, as on the map) or a city (id = "c<geonameid>"). */
export interface Place {
  id: string;
  name: string;
  kind: "country" | "city";
  /** Spanish country name (cities only). */
  country?: string;
  /** Map id of the country that contains the place, when known. */
  countryId?: string;
  lon: number;
  lat: number;
}

type CityRow = [number, string, string, number, number, number, string[]];
interface CityIndex { countries: Record<string, string>; iso2: Record<string, string>; cities: CityRow[] }

export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const COUNTRIES = map.countries.map((c) => ({ id: c.id, name: c.name, n: normalize(c.name), cx: c.cx, cy: c.cy }));

let index: Promise<CityIndex> | null = null;
/** The city index is ~380 KB, so it is only downloaded the first time the search is used. */
export function loadCities(): Promise<CityIndex> {
  if (!index) index = import("@/generated/cities.json").then((m) => (m.default ?? m) as unknown as CityIndex);
  return index;
}

const rank = (n: string, q: string, words: string[]) => {
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (words.some((w) => w.startsWith(q))) return 2;
  if (q.length >= 4 && n.includes(q)) return 3;
  return -1;
};

export function countryPlace(id: string): Place | undefined {
  const c = map.countries.find((x) => x.id === id);
  if (!c) return undefined;
  return { id, name: c.name, kind: "country", lon: 0, lat: 0 };
}

/** Offline search over countries and the city index. Countries first, then cities by population. */
export async function searchPlaces(query: string, limit = 8): Promise<Place[]> {
  const q = normalize(query);
  if (q.length < 2) return [];
  const idx = await loadCities();
  const hits: { r: number; pop: number; place: Place }[] = [];
  for (const c of COUNTRIES) {
    const r = rank(c.n, q, c.n.split(/[\s-]+/));
    if (r >= 0) hits.push({ r, pop: Infinity, place: { id: c.id, name: c.name, kind: "country", lon: 0, lat: 0 } });
  }
  for (const [gid, name, cid, lat, lon, pop, alts] of idx.cities) {
    const names = [name, ...alts];
    let best = -1;
    for (const nm of names) {
      const n = normalize(nm);
      const r = rank(n, q, n.split(/[\s-]+/));
      if (r >= 0 && (best < 0 || r < best)) best = r;
    }
    if (best < 0) continue;
    hits.push({ r: best, pop, place: { id: `c${gid}`, name, kind: "city", country: idx.countries[cid] ?? cid, countryId: cid, lon, lat } });
  }
  hits.sort((a, b) => a.r - b.r || b.pop - a.pop);
  return hits.slice(0, limit).map((h) => h.place);
}

/**
 * Online fallback (OpenStreetMap Nominatim) for places missing from the offline index. Only called when the
 * visitor explicitly asks for it, never while typing, as their usage policy requires.
 */
export async function searchOnline(query: string): Promise<Place[]> {
  const idx = await loadCities();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=es&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocoder");
  const rows = (await res.json()) as { place_id: number; name: string; display_name: string; lat: string; lon: string; addresstype: string; address?: { country?: string; country_code?: string } }[];
  // Nominatim names can carry several scripts ("Merzouga ⵎⴰⵔⵣⵓⴳⴰ مرزوكة"): keep the Latin part.
  const clean = (s: string) => s.replace(/[^\p{Script=Latin}\p{P}\s\d]/gu, "").replace(/\s+/g, " ").trim();
  return rows
    .map((r) => ({ ...r, name: clean(r.name || r.display_name.split(",")[0]) }))
    .filter((r) => r.name)
    .map((r) => {
      const cc = r.address?.country_code?.toUpperCase();
      const countryId = cc ? idx.iso2[cc] : undefined;
      if (r.addresstype === "country" && countryId) return countryPlace(countryId) ?? null;
      return { id: `o${r.place_id}`, name: r.name, kind: "city" as const, country: r.address?.country, countryId, lon: Number(r.lon), lat: Number(r.lat) };
    })
    .filter((p): p is Place => p !== null);
}

/* ---------- Registry: names and coordinates of the chosen places, so the form can label them offline ---------- */
export function rememberPlace(p: Place) {
  const all = readJSON<Record<string, Place>>(KEYS.places, {});
  all[p.id] = p;
  writeJSON(KEYS.places, all);
}
export function getPlace(id: string): Place | undefined {
  return readJSON<Record<string, Place>>(KEYS.places, {})[id] ?? countryPlace(id);
}
/** "Lisboa, Portugal" for a city, the country name for a country. */
export function placeLabel(id: string): string {
  const p = getPlace(id);
  if (!p) return id;
  return p.kind === "city" && p.country ? `${p.name}, ${p.country}` : p.name;
}
