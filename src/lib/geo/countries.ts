import map from "@/generated/world-map.json";
import { loadCities } from "./places";
import { unproject } from "./equal-earth";

/** A country the admin can pick for a destination: its map id (ISO numeric), ISO2 code and centre. */
export interface MapCountry {
  id: string;
  name: string;
  code: string;
  lon: number;
  lat: number;
}

/** Spanish names for the small countries drawn as points, where the city index only has the English one. */
const POINT_NAMES: Record<string, string> = { "462": "Maldivas" };

let list: Promise<MapCountry[]> | null = null;

/** Every country on the map (polygons and points), sorted by Spanish name. Loaded once. */
export function loadMapCountries(): Promise<MapCountry[]> {
  if (!list) {
    list = loadCities().then((idx) => {
      const iso2 = new Map(Object.entries(idx.iso2).map(([code, id]) => [id, code]));
      const out: MapCountry[] = [];
      for (const c of map.countries) {
        if (c.id.startsWith("-")) continue; // disputed territories without an ISO code
        const [lon, lat] = unproject(c.cx, c.cy);
        out.push({ id: c.id, name: c.name, code: iso2.get(c.id) ?? "", lon, lat });
      }
      const seen = new Set(out.map((c) => c.id));
      for (const p of map.points) {
        if (seen.has(p.id)) continue; // big countries also carry a marker point
        const [lon, lat] = unproject(p.x, p.y);
        out.push({ id: p.id, name: POINT_NAMES[p.id] ?? idx.countries[p.id] ?? p.id, code: iso2.get(p.id) ?? "", lon, lat });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name, "es"));
    });
  }
  return list;
}
