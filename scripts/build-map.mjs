// Builds a thin-line world map (Natural Earth 110m via world-atlas) projected with Equal Earth.
// Emits one SVG path per country (so countries can be selected) and projects the
// destination markers (lon/lat from src/data/destinations.json) into the same space.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoEqualEarth, geoPath } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = require("world-atlas/countries-110m.json");
const countries = feature(topo, topo.objects.countries);
countries.features = countries.features.filter((f) => f.id !== "010"); // drop Antarctica

const names = JSON.parse(readFileSync("src/data/country-names.es.json", "utf8"));
const width = 1600, height = 800;
const projection = geoEqualEarth().fitExtent([[20, 20], [width - 20, height - 20]], countries);
const path = geoPath(projection).digits(1);

// Some Natural Earth features share the id "-99" (disputed territories); make keys unique.
const seen = new Map();
const list = countries.features
  .map((f) => {
    let id = String(f.id ?? "-99");
    const n = seen.get(id) || 0;
    seen.set(id, n + 1);
    if (n > 0 || id === "-99") id = `${id}-${n}`;
    const en = (f.properties && f.properties.name) || "";
    const [cx, cy] = path.centroid(f);
    return { id, name: names[en] || en, d: path(f), cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
  })
  .filter((c) => c.d);

const destinations = JSON.parse(readFileSync("src/data/destinations.json", "utf8"));
const points = destinations.map((d) => {
  const [x, y] = projection([d.lon, d.lat]);
  return { id: d.id, x: +x.toFixed(1), y: +y.toFixed(1) };
});
writeFileSync("src/generated/world-map.json", JSON.stringify({ width, height, countries: list, points }));
console.log("map ok", list.length, "countries,", points.length, "points");
