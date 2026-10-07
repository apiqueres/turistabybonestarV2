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
