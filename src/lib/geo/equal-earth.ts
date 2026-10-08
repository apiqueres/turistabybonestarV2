import map from "@/generated/world-map.json";

/** Equal Earth forward projection (Šavrič et al., 2018), matching d3-geo's geoEqualEarth with the stored scale/translate. */
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
const RAD = Math.PI / 180;

export function project(lon: number, lat: number): [number, number] {
  const l = Math.asin(M * Math.sin(lat * RAD));
  const l2 = l * l, l6 = l2 * l2 * l2;
  const x = (lon * RAD * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
  const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
  const { scale, translate } = map.projection;
  return [translate[0] + scale * x, translate[1] - scale * y];
}

export const MAP_W = map.width;
export const MAP_H = map.height;

/** Inverse projection: map coordinates (px) back to [lon, lat]; Newton iteration as in d3-geo. */
export function unproject(px: number, py: number): [number, number] {
  const { scale, translate } = map.projection;
  const x = (px - translate[0]) / scale;
  const y = (translate[1] - py) / scale;
  let l = y, l2 = l * l, l6 = l2 * l2 * l2;
  for (let i = 0; i < 12; i++) {
    const fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y;
    const fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2);
    const delta = fy / fpy;
    l -= delta;
    l2 = l * l;
    l6 = l2 * l2 * l2;
    if (Math.abs(delta) < 1e-12) break;
  }
  const lon = (M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))) / Math.cos(l) / RAD;
  const lat = Math.asin(Math.sin(l) / M) / RAD;
  return [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10];
}
