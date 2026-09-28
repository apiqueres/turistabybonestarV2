/** Build-time flags shared by server and client code. */

/** "/turistabybonestarV2" on GitHub Pages, "" on the VPS. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Static demo (GitHub Pages): no API, forms are simulated in the browser. */
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

/** Prefixes a public asset path ("/media/x.webp") with the base path. */
export const asset = (path: string) => (path.startsWith("/") ? `${BASE_PATH}${path}` : path);
